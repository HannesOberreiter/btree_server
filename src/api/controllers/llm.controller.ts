import type { FastifyReply, FastifyRequest } from 'fastify';
import type { LlmProvider } from '../../services/llm.service.js';
import httpErrors from 'http-errors';
import { KyselyServer } from '../../servers/kysely.server.js';
import { chat, chatStream } from '../../services/llm.service.js';
import { encrypt } from '../utils/crypto.util.js';

export const LLM_PROVIDERS: LlmProvider[] = ['openai', 'mistral'];

export default class LlmController {
  /**
   * Save (upsert) an LLM API token for the authenticated user.
   * POST /v1/llm/token
   */
  static async saveToken(req: FastifyRequest, _reply: FastifyReply) {
    const { provider, access_token } = req.body as {
      provider: LlmProvider
      access_token: string
    };

    if (!LLM_PROVIDERS.includes(provider)) {
      throw httpErrors.BadRequest(`Unsupported provider. Supported: ${LLM_PROVIDERS.join(', ')}`);
    }

    const payload = JSON.stringify({ access_token });
    const encrypted = encrypt(payload);
    const beeId = req.session.user.bee_id;
    const db = KyselyServer.getInstance().db;

    const existing = await db
      .selectFrom('user_llm_tokens')
      .select('id')
      .where('bee_id', '=', beeId)
      .where('provider', '=', provider)
      .executeTakeFirst();

    if (existing) {
      await db
        .updateTable('user_llm_tokens')
        .set({ tokens: encrypted })
        .where('id', '=', existing.id)
        .execute();
    }
    else {
      await db
        .insertInto('user_llm_tokens')
        .values({ bee_id: beeId, provider, tokens: encrypted })
        .execute();
    }

    return { provider };
  }

  /**
   * Delete the LLM token for a provider.
   * DELETE /v1/llm/token/:provider
   */
  static async deleteToken(req: FastifyRequest, _reply: FastifyReply) {
    const { provider } = req.params as { provider: string };
    const beeId = req.session.user.bee_id;
    const db = KyselyServer.getInstance().db;

    await db
      .deleteFrom('user_llm_tokens')
      .where('bee_id', '=', beeId)
      .where('provider', '=', provider)
      .execute();

    return { provider };
  }

  /**
   * List connected LLM providers (without revealing tokens).
   * GET /v1/llm/token
   */
  static async listTokens(req: FastifyRequest, _reply: FastifyReply) {
    const beeId = req.session.user.bee_id;
    const db = KyselyServer.getInstance().db;

    const rows = await db
      .selectFrom('user_llm_tokens')
      .select(['id', 'provider', 'created_at', 'updated_at'])
      .where('bee_id', '=', beeId)
      .execute();

    return rows;
  }

  /**
   * Chat with an LLM (non-streaming).
   * POST /v1/llm/chat
   */
  static async chatHandler(req: FastifyRequest, _reply: FastifyReply) {
    const { provider, messages } = req.body as {
      provider: LlmProvider
      messages: Array<{ role: 'user' | 'assistant' | 'system', content: string }>
    };

    if (!LLM_PROVIDERS.includes(provider)) {
      throw httpErrors.BadRequest(`Unsupported provider. Supported: ${LLM_PROVIDERS.join(', ')}`);
    }

    const beeId = req.session.user.bee_id;

    try {
      const answer = await chat(beeId, provider, messages);
      return { answer };
    }
    catch (e: any) {
      if (e.message?.includes('No LLM token found')) {
        throw httpErrors.NotFound('No LLM token configured for this provider');
      }
      throw new httpErrors.InternalServerError(e.message ?? 'LLM request failed');
    }
  }

  /**
   * Chat with an LLM using SSE streaming.
   * POST /v1/llm/chat/stream
   */
  static async chatStreamHandler(req: FastifyRequest, reply: FastifyReply) {
    const { provider, messages } = req.body as {
      provider: LlmProvider
      messages: Array<{ role: 'user' | 'assistant' | 'system', content: string }>
    };

    if (!LLM_PROVIDERS.includes(provider)) {
      throw httpErrors.BadRequest(`Unsupported provider. Supported: ${LLM_PROVIDERS.join(', ')}`);
    }

    const beeId = req.session.user.bee_id;

    try {
      await chatStream(beeId, provider, messages, req, reply);
    }
    catch (e: any) {
      if (e.message?.includes('No LLM token found')) {
        throw httpErrors.NotFound('No LLM token configured for this provider');
      }
      throw new httpErrors.InternalServerError(e.message ?? 'LLM stream failed');
    }
  }
}
