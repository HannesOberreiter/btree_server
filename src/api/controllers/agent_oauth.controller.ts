import type { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';

import {
  createAuthorizationCode,
  exchangeAuthorizationCode,
  getOAuthAuthorizeData,
  getOAuthLoginRedirect,
  refreshAccessToken,
} from '../utils/agent_oauth.util.js';

type TokenRequestBody = {
  grant_type?: string;
  client_id?: string;
  client_secret?: string;
  code?: string;
  redirect_uri?: string;
  refresh_token?: string;
};

export default class AgentOAuthController {
  static async authorize(req: FastifyRequest, reply: FastifyReply) {
    const authorizeData = getOAuthAuthorizeData(req);
    const sessionUser = req.session?.user;

    if (!sessionUser) {
      return reply.redirect(getOAuthLoginRedirect(req));
    }

    const code = await createAuthorizationCode({
      clientId: authorizeData.clientId,
      redirectUri: authorizeData.redirectUri,
      scope: authorizeData.scope,
      beeId: sessionUser.bee_id,
      userId: sessionUser.user_id,
      rank: sessionUser.rank,
    });

    const redirectUrl = new URL(authorizeData.redirectUri);
    redirectUrl.searchParams.set('code', code);
    if (authorizeData.state) {
      redirectUrl.searchParams.set('state', authorizeData.state);
    }

    return reply.redirect(redirectUrl.toString());
  }

  static async token(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as TokenRequestBody;
    const grantType = body.grant_type;
    const clientId = body.client_id ?? '';
    const clientSecret = body.client_secret ?? '';

    if (grantType === 'authorization_code') {
      if (!body.code || !body.redirect_uri) {
        throw httpErrors.BadRequest('Missing code or redirect_uri');
      }
      return exchangeAuthorizationCode(
        body.code,
        clientId,
        clientSecret,
        body.redirect_uri,
      );
    }

    if (grantType === 'refresh_token') {
      if (!body.refresh_token) {
        throw httpErrors.BadRequest('Missing refresh_token');
      }
      return refreshAccessToken(body.refresh_token, clientId, clientSecret);
    }

    throw httpErrors.BadRequest('Unsupported grant_type');
  }
}
