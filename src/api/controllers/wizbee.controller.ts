import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ChatMessage } from '../../services/wizbee.service.js';
import type { WizBeeStreamBody } from '../schemas/wizbee.schema.js';
import httpErrors from 'http-errors';
import { sql } from 'kysely';
import { mistralAI } from '../../config/environment.config.js';
import { KyselyServer } from '../../servers/kysely.server.js';
import { WizBeeAI } from '../../services/wizbee.service.js';
import { isPremium } from '../utils/premium.util.js';

/**
 * Mistral pricing (per 1K tokens) - using conservative/higher estimates
 * Actual mistral-medium-latest: ~$2/1M input, ~$6/1M output
 * Using inflated estimates for budget safety margin
 * - Input: $0.003 (~50% buffer over actual)
 * - Output: $0.010 (~66% buffer over actual)
 */
const PRICE_PER_1K_INPUT_TOKENS = 0.003;
const PRICE_PER_1K_OUTPUT_TOKENS = 0.010;

export interface MonthlyUsage {
  totalInputTokens: number
  totalOutputTokens: number
  totalRequests: number
  estimatedCostUSD: number
  monthlyLimitUSD: number
  remainingBudgetUSD: number
  isOverBudget: boolean
}

/**
 * Calculate estimated cost for tokens
 */
function calculateTokenCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1000) * PRICE_PER_1K_INPUT_TOKENS
    + (outputTokens / 1000) * PRICE_PER_1K_OUTPUT_TOKENS;
}

/**
 * Get monthly usage statistics for a company (grouped by user_id)
 */
async function getMonthlyUsage(userId: number): Promise<MonthlyUsage> {
  const db = KyselyServer.getInstance().db;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const result = await db
    .selectFrom('wizbee_requests')
    .select([
      sql<number>`COALESCE(SUM(tokens_input), 0)`.as('totalInputTokens'),
      sql<number>`COALESCE(SUM(tokens_output), 0)`.as('totalOutputTokens'),
      sql<number>`COUNT(*)`.as('totalRequests'),
    ])
    .where('user_id', '=', userId)
    .where('request_time', '>=', startOfMonth)
    .where('request_time', '<=', endOfMonth)
    .executeTakeFirst();

  const totalInputTokens = Number(result?.totalInputTokens ?? 0);
  const totalOutputTokens = Number(result?.totalOutputTokens ?? 0);
  const totalRequests = Number(result?.totalRequests ?? 0);
  const estimatedCostUSD = calculateTokenCost(totalInputTokens, totalOutputTokens);
  const monthlyLimitUSD = mistralAI.monthlyBudgetUSD;
  const remainingBudgetUSD = Math.max(0, monthlyLimitUSD - estimatedCostUSD);

  return {
    totalInputTokens,
    totalOutputTokens,
    totalRequests,
    estimatedCostUSD,
    monthlyLimitUSD,
    remainingBudgetUSD,
    isOverBudget: estimatedCostUSD >= monthlyLimitUSD,
  };
}

/**
 * Check if user has exceeded monthly budget
 */
async function checkMonthlyBudget(userId: number): Promise<boolean> {
  const usage = await getMonthlyUsage(userId);
  return !usage.isOverBudget;
}

/**
 * Log a WizBee request with token usage
 */
async function logWizBeeRequest(params: {
  beeId: number
  userId: number
  tokensInput: number
  tokensOutput: number
  userRequest: string
}): Promise<void> {
  const db = KyselyServer.getInstance().db;

  await db
    .insertInto('wizbee_requests')
    .values({
      bee_id: params.beeId,
      user_id: params.userId,
      tokens_input: params.tokensInput,
      tokens_output: params.tokensOutput,
      user_request: params.userRequest.substring(0, 65535), // Limit to TEXT max
      request_time: new Date(),
    })
    .execute();
}

export default class WizBeeController {
  /**
   * Get WizBee monthly usage statistics
   */
  static async getWizBeeUsage(req: FastifyRequest, _reply: FastifyReply) {
    const premium = await isPremium(req.session.user.user_id);
    if (!premium) {
      throw httpErrors.PaymentRequired();
    }

    const usage = await getMonthlyUsage(req.session.user.user_id);
    return usage;
  }

  static async askWizBeeStream(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as WizBeeStreamBody;

    /* Safety timeout if stream hangs */
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      req.log.error({ body: req.body }, 'WizBee timeout');
    }, 120 * 1000);
    timeout.unref();

    const premium = await isPremium(req.session.user.user_id);
    if (!premium) {
      throw httpErrors.PaymentRequired();
    }

    // Check monthly budget
    const withinBudget = await checkMonthlyBudget(req.session.user.user_id);
    if (!withinBudget) {
      throw httpErrors.TooManyRequests('Monthly budget limit reached');
    }

    const bot = new WizBeeAI(
      req.session.user.user_id,
      req.session.user.bee_id,
    );

    if (controller.signal.aborted) {
      return;
    }

    // Set up streaming headers
    if (!reply.raw.getHeader('Access-Control-Allow-Origin')) {
      if (!req.headers.origin) {
        if (req.headers.referer) {
          const url = new URL(req.headers.referer);
          req.headers.origin = url.origin;
        }
        else if (req.headers.host) {
          req.headers.origin = req.headers.host;
        }
      }
      const origin = req.headers.origin;
      reply.raw.setHeader('Access-Control-Allow-Origin', origin);
    }

    if (!reply.raw.getHeader('Access-Control-Allow-Credentials')) {
      reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    reply.raw.setHeader('Content-Type', 'application/x-ndjson');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');

    const history: ChatMessage[] = body.history ?? [];
    let tokensInput = 0;
    let tokensOutput = 0;

    try {
      for await (const chunk of bot.chatStream(body.question, history, controller.signal)) {
        if (controller.signal.aborted) {
          break;
        }

        // Capture actual token usage from the done chunk
        if (chunk.type === 'done' && chunk.usage) {
          tokensInput = chunk.usage.inputTokens;
          tokensOutput = chunk.usage.outputTokens;
        }

        reply.raw.write(`${JSON.stringify(chunk)}\n`);
      }
    }
    catch (e) {
      req.log.error(e);
      reply.raw.write(
        `${JSON.stringify({
          type: 'error',
          content: 'An error occurred while processing your request',
        })}\n`,
      );
    }
    finally {
      // Always log request (even with 0 tokens or on error) for tracking
      try {
        await logWizBeeRequest({
          beeId: req.session.user.bee_id,
          userId: req.session.user.user_id,
          tokensInput,
          tokensOutput,
          userRequest: body.question,
        });
      }
      catch (e) {
        req.log.error(e, 'Failed to log WizBee request');
      }

      clearTimeout(timeout);
      reply.raw.end();
    }

    return reply;
  }
}
