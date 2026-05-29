import { Buffer } from 'node:buffer';

import type { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';
import { sql } from 'kysely';

import { mistralAI } from '../../config/environment.config.js';
import { KyselyServer } from '../../servers/kysely.server.js';
import type { ChatMessage } from '../../services/wizbee.service.js';
import { WizBeeAI } from '../../services/wizbee.service.js';
import { transcribeAudio } from '../../services/wizbee.transcribe.service.js';
import type { WizBeeStreamBody } from '../schemas/wizbee.schema.js';
import { isPremium } from '../utils/premium.util.js';

/**
 * Mistral pricing (per 1K tokens) for `mistral-medium-2508` (pinned in wizbee.service.ts).
 * Verify against https://mistral.ai/pricing before adjusting.
 * Include a safety margin to account for potential price increases or tokenization differences.
 */
const SAFETY_MARGIN = 1.5;
const PRICE_PER_1K_INPUT_TOKENS_EUR = 0.00037 * SAFETY_MARGIN;
const PRICE_PER_1K_OUTPUT_TOKENS_EUR = 0.00185 * SAFETY_MARGIN;

const CONTEXT_OVERFLOW_RE =
  /maximum context length|context[_ ]?length|too large|prompt contains \d+ tokens/i;

export interface MonthlyUsage {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalRequests: number;
  estimatedCostEUR: number;
  monthlyLimitEUR: number;
  remainingBudgetEUR: number;
  isOverBudget: boolean;
}

/**
 * Calculate estimated cost for tokens in EUR
 */
function calculateTokenCost(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1000) * PRICE_PER_1K_INPUT_TOKENS_EUR +
    (outputTokens / 1000) * PRICE_PER_1K_OUTPUT_TOKENS_EUR
  );
}

/**
 * Get monthly usage statistics for a company (grouped by user_id)
 */
async function getMonthlyUsage(userId: number): Promise<MonthlyUsage> {
  const db = KyselyServer.getInstance().db;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

  const result = await db
    .selectFrom('wizbee_requests')
    .select([
      sql<number>`COALESCE(SUM(tokens_input), 0)`.as('totalInputTokens'),
      sql<number>`COALESCE(SUM(tokens_output), 0)`.as('totalOutputTokens'),
      sql<number>`COUNT(*)`.as('totalRequests'),
      sql<number>`COALESCE(SUM(cost_eur), 0)`.as('totalCostEUR'),
    ])
    .where('user_id', '=', userId)
    .where('request_time', '>=', startOfMonth)
    .where('request_time', '<=', endOfMonth)
    .executeTakeFirst();

  const totalInputTokens = Number(result?.totalInputTokens ?? 0);
  const totalOutputTokens = Number(result?.totalOutputTokens ?? 0);
  const totalRequests = Number(result?.totalRequests ?? 0);
  const estimatedCostEUR = Number(result?.totalCostEUR ?? 0);
  const monthlyLimitEUR = mistralAI.monthlyBudgetEUR;
  const remainingBudgetEUR = Math.max(0, monthlyLimitEUR - estimatedCostEUR);

  return {
    totalInputTokens,
    totalOutputTokens,
    totalRequests,
    estimatedCostEUR,
    monthlyLimitEUR,
    remainingBudgetEUR,
    isOverBudget: estimatedCostEUR >= monthlyLimitEUR,
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
 * Log a WizBee request with token usage and cost
 */
async function logWizBeeRequest(params: {
  beeId: number;
  userId: number;
  tokensInput: number;
  tokensOutput: number;
  costEur: number;
  userRequest: string;
}): Promise<void> {
  const db = KyselyServer.getInstance().db;

  await db
    .insertInto('wizbee_requests')
    .values({
      bee_id: params.beeId,
      user_id: params.userId,
      tokens_input: params.tokensInput,
      tokens_output: params.tokensOutput,
      cost_eur: params.costEur,
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
      throw httpErrors.PaymentRequired(
        'WizBee requires an active premium subscription',
      );
    }

    const usage = await getMonthlyUsage(req.session.user.user_id);
    return usage;
  }

  static async askWizBeeStream(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as WizBeeStreamBody;

    req.log.info('Received WizBee stream request');

    /* Safety timeout if stream hangs */
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      req.log.error({ body: req.body }, 'WizBee timeout');
    }, 120 * 1000);
    timeout.unref();

    const premium = await isPremium(req.session.user.user_id);
    if (!premium) {
      throw httpErrors.PaymentRequired(
        'WizBee requires an active premium subscription',
      );
    }

    // Check monthly budget
    const withinBudget = await checkMonthlyBudget(req.session.user.user_id);
    if (!withinBudget) {
      throw httpErrors.TooManyRequests(
        'Monthly WizBee usage budget exceeded — resets at the start of next month',
      );
    }

    const question = body.question;

    const bot = new WizBeeAI(req.session.user.user_id, req.session.user.bee_id);

    if (controller.signal.aborted) {
      return;
    }

    // Set up streaming headers
    if (!reply.raw.getHeader('Access-Control-Allow-Origin')) {
      if (!req.headers.origin) {
        if (req.headers.referer) {
          const url = new URL(req.headers.referer);
          req.headers.origin = url.origin;
        } else if (req.headers.host) {
          req.headers.origin = req.headers.host;
        }
      }
      const origin = req.headers.origin!;
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
      for await (const chunk of bot.chatStream(
        question,
        history,
        controller.signal,
      )) {
        if (controller.signal.aborted) {
          break;
        }

        // Capture actual token usage from the done chunk
        if (chunk.type === 'done' && chunk.usage) {
          tokensInput = chunk.usage.inputTokens;
          tokensOutput = chunk.usage.outputTokens;
        }

        // Translate Mistral's context-overflow error into something a user
        // (and WizBee on a retry) can act on.
        if (chunk.type === 'error' && typeof chunk.content === 'string') {
          const msg = chunk.content;
          const isContextOverflow = CONTEXT_OVERFLOW_RE.test(msg);
          if (isContextOverflow) {
            const friendly =
              'Your request returned too much data for me to process in one step. Please narrow it down — e.g. ask about a single year, a single apiary, or use a summary question like "harvest totals per year" instead of "all activities of the last 4 years".';
            reply.raw.write(
              `${JSON.stringify({ type: 'error', content: friendly })}\n`,
            );
            req.log.warn(
              { originalError: msg },
              'WizBee context overflow — replaced with user-friendly message',
            );
            continue;
          }
        }

        reply.raw.write(`${JSON.stringify(chunk)}\n`);
      }
    } catch (error) {
      req.log.error(error);
      reply.raw.write(
        `${JSON.stringify({
          type: 'error',
          content: 'An error occurred while processing your request',
        })}\n`,
      );
    } finally {
      // Always log request (even with 0 tokens or on error) for tracking
      try {
        const costEur = calculateTokenCost(tokensInput, tokensOutput);
        await logWizBeeRequest({
          beeId: req.session.user.bee_id,
          userId: req.session.user.user_id,
          tokensInput,
          tokensOutput,
          costEur,
          userRequest: question,
        });
      } catch (error) {
        req.log.error(error, 'Failed to log WizBee request');
      }

      clearTimeout(timeout);
      reply.raw.end();
    }

    return reply;
  }

  /**
   * Transcribe a short voice recording into text using Mistral Voxtral.
   *
   * The route is multipart: `audio` is the raw audio file uploaded by the
   * browser (webm/ogg/mp3/wav), `language` (optional) is the UI language so
   * we can improve accuracy. Returns `{ text, language }` — the client then
   * puts `text` into the chat input and sends it as a normal WizBee question.
   *
   * Budget: we charge the transcription against the same monthly WizBee
   * budget using the token usage Mistral returns (roughly equivalent to a
   * cheap chat call) so users can't bypass the limit by spamming audio.
   */
  static async transcribeWizBeeAudio(
    req: FastifyRequest,
    _reply: FastifyReply,
  ) {
    const premium = await isPremium(req.session.user.user_id);
    if (!premium) {
      throw httpErrors.PaymentRequired(
        'WizBee requires an active premium subscription',
      );
    }

    const withinBudget = await checkMonthlyBudget(req.session.user.user_id);
    if (!withinBudget) {
      throw httpErrors.TooManyRequests(
        'Monthly WizBee usage budget exceeded — resets at the start of next month',
      );
    }

    // With `attachFieldsToBody: 'keyValues'` the multipart plugin exposes
    // each file field as a Buffer on req.body. See app.config.ts.
    const body = (req.body ?? {}) as Record<string, unknown>;
    const audio = body.audio;
    const language =
      typeof body.language === 'string' ? body.language : undefined;
    const fileName =
      typeof body.fileName === 'string' && body.fileName.trim().length > 0
        ? body.fileName
        : 'voice.webm';

    if (!audio || !Buffer.isBuffer(audio)) {
      throw httpErrors.BadRequest('Missing or invalid audio upload');
    }
    if (audio.length === 0) {
      throw httpErrors.BadRequest('Empty audio upload');
    }

    let result: Awaited<ReturnType<typeof transcribeAudio>>;
    try {
      result = await transcribeAudio({ audio, fileName, language });
    } catch (error) {
      req.log.error(error, 'WizBee transcription failed');
      throw httpErrors.BadGateway('Voice transcription failed');
    }

    // Log against the WizBee budget (best-effort).
    try {
      const costEur = calculateTokenCost(
        result.usage.promptTokens,
        result.usage.completionTokens,
      );
      await logWizBeeRequest({
        beeId: req.session.user.bee_id,
        userId: req.session.user.user_id,
        tokensInput: result.usage.promptTokens,
        tokensOutput: result.usage.completionTokens,
        costEur,
        userRequest: `[voice] ${result.text}`,
      });
    } catch (error) {
      req.log.error(error, 'Failed to log WizBee transcription request');
    }

    return {
      text: result.text,
      language: result.language,
    };
  }
}
