import type { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';
import { AgentKeyModel, KEY_PREFIX_LENGTH, verifyAgentKey } from '../models/agent_key.model.js';

/**
 * Fastify preHandler hook that authenticates requests using an Agent API key.
 * Expects: Authorization: Bearer btree_ak_...
 *
 * On success, populates request.session.user with { user_id, bee_id }
 * and sets request.session.agent = true.
 */
export async function agentAuthHook(
  request: FastifyRequest,
  _reply: FastifyReply,
) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw httpErrors.Unauthorized('Missing or invalid Authorization header. Expected: Bearer btree_ak_...');
  }

  const plaintextKey = authHeader.slice(7).trim();
  if (!plaintextKey.startsWith('btree_ak_')) {
    throw httpErrors.Unauthorized('Invalid API key format. Expected key starting with btree_ak_');
  }

  const prefix = plaintextKey.substring(0, KEY_PREFIX_LENGTH);
  const candidates = await AgentKeyModel.findByPrefix(prefix);

  if (candidates.length === 0) {
    throw httpErrors.Unauthorized('Invalid API key');
  }

  for (const candidate of candidates) {
    if (verifyAgentKey(plaintextKey, candidate.key_hash, candidate.salt)) {
      // Check expiry
      if (candidate.valid_to && new Date(candidate.valid_to) < new Date()) {
        throw httpErrors.Unauthorized('API key has expired');
      }

      // Populate session
      if (!request.session) {
        (request as any).session = {};
      }
      request.session.user = {
        user_id: candidate.user_id,
        bee_id: candidate.bee_id,
      } as any;
      (request.session as any).agent = true;

      // Update last_used async (don't block the request)
      AgentKeyModel.updateLastUsed(candidate.id).catch(() => {});

      return;
    }
  }

  throw httpErrors.Unauthorized('Invalid API key');
}
