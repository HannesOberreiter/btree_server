import type { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';
import { verifyAgentOAuthAccessToken } from '../utils/agent_oauth.util.js';

export async function chatGptAuthHook(
  request: FastifyRequest,
  _reply: FastifyReply,
) {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path.endsWith('/openapi.json') || path.includes('/oauth/')) {
    return;
  }

  const authHeader = request.headers.authorization;
  const [scheme, ...credentialParts] = authHeader?.split(' ') ?? [];
  if (!authHeader || scheme.toLowerCase() !== 'bearer') {
    throw httpErrors.Unauthorized(
      'Missing or invalid Authorization header. Expected OAuth bearer token',
    );
  }

  const token = credentialParts.join(' ').trim();
  if (!token.startsWith('btree_oauth_')) {
    throw httpErrors.Unauthorized(
      'Invalid OAuth token. Reconnect your b.tree account in ChatGPT.',
    );
  }

  let oauthUser: ReturnType<typeof verifyAgentOAuthAccessToken>;
  try {
    oauthUser = verifyAgentOAuthAccessToken(token);
  } catch {
    throw httpErrors.Unauthorized(
      'Invalid OAuth token. Reconnect your b.tree account in ChatGPT.',
    );
  }

  request.session.user = {
    user_id: oauthUser.userId,
    bee_id: oauthUser.beeId,
    rank: oauthUser.rank,
  } as FastifyRequest['session']['user'];
  request.session.agent = true;
}
