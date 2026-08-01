import type { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';

import { KyselyServer } from '../../servers/kysely.server.js';
import {
  findAgentKeysByPrefix,
  KEY_PREFIX_LENGTH,
  updateAgentKeyLastUsed,
  verifyAgentKey,
} from '../modules/agent_key.module.js';

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
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path.endsWith('/openapi.json')) {
    return;
  }

  const authHeader = request.headers.authorization;
  const [scheme, ...credentialParts] = authHeader?.split(' ') ?? [];
  if (!authHeader || scheme.toLowerCase() !== 'bearer') {
    throw httpErrors.Unauthorized(
      'Missing or invalid Authorization header. Expected: Bearer btree_ak_...',
    );
  }

  const plaintextKey = credentialParts.join(' ').trim();
  if (!plaintextKey.startsWith('btree_ak_')) {
    throw httpErrors.Unauthorized(
      'Invalid API key format. Expected key starting with btree_ak_',
    );
  }

  const prefix = plaintextKey.substring(0, KEY_PREFIX_LENGTH);
  const db = KyselyServer.getInstance().db;
  const candidates = await findAgentKeysByPrefix(db, prefix);

  if (candidates.length === 0) {
    throw httpErrors.Unauthorized('Invalid API key');
  }

  for (const candidate of candidates) {
    if (verifyAgentKey(plaintextKey, candidate.key_hash, candidate.salt)) {
      // Check expiry
      if (candidate.valid_to && new Date(candidate.valid_to) < new Date()) {
        throw httpErrors.Unauthorized('API key has expired');
      }

      const companyBee = await db
        .selectFrom('company_bee')
        .select('rank')
        .where('bee_id', '=', candidate.bee_id)
        .where('user_id', '=', candidate.user_id)
        .executeTakeFirst();
      if (!companyBee?.rank) {
        throw httpErrors.Unauthorized('User no longer has company access');
      }

      // Populate session with current company role so every tool can enforce
      // the same authorization policy as its REST endpoint.
      request.session.user = {
        user_id: candidate.user_id,
        bee_id: candidate.bee_id,
        rank: companyBee.rank as 1 | 2 | 3 | 4,
      } as FastifyRequest['session']['user'];
      request.session.agent = true;

      // Update last_used async (don't block the request)
      updateAgentKeyLastUsed(db, candidate.id).catch(() => {});

      return;
    }
  }

  throw httpErrors.Unauthorized('Invalid API key');
}
