import {
  bearerAuthChallengeResponse,
  getOAuthProtectedResourceMetadataUrl,
  OAuthError,
  OAuthErrorCode,
  verifyBearerToken,
  type AuthInfo,
  type OAuthTokenVerifier,
} from '@modelcontextprotocol/server';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { mcp } from '../../config/environment.config.js';
import { KyselyServer } from '../../servers/kysely.server.js';
import { requireAgentOAuthAccess } from '../modules/agent_oauth.module.js';
import { verifyMcpAccessToken } from '../modules/mcp_oauth.module.js';

const resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(
  new URL(mcp.resourceUrl),
);

function errorStatus(error: unknown) {
  if (
    error !== null &&
    typeof error === 'object' &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  ) {
    return error.statusCode;
  }
  return undefined;
}

const tokenVerifier: OAuthTokenVerifier = {
  async verifyAccessToken(token: string): Promise<AuthInfo> {
    let payload: ReturnType<typeof verifyMcpAccessToken>;
    try {
      payload = verifyMcpAccessToken(token);
    } catch {
      throw new OAuthError(
        OAuthErrorCode.InvalidToken,
        'Invalid or expired MCP access token',
      );
    }

    let rank: 1 | 2 | 3 | 4;
    try {
      rank = await requireAgentOAuthAccess(
        KyselyServer.getInstance().db,
        payload.user_id,
        payload.bee_id,
      );
    } catch (error) {
      if (errorStatus(error) === 403) {
        throw new OAuthError(
          OAuthErrorCode.InsufficientScope,
          'Current b.tree account cannot use MCP tools',
        );
      }
      throw new OAuthError(OAuthErrorCode.InvalidToken, 'Invalid MCP account');
    }

    return {
      token,
      clientId: payload.client_id,
      scopes: payload.scope.split(/\s+/).filter(Boolean),
      expiresAt: payload.exp,
      resource: new URL(mcp.resourceUrl),
      extra: {
        userId: payload.user_id,
        beeId: payload.bee_id,
        rank,
      },
    };
  },
};

const bearerOptions = {
  verifier: tokenVerifier,
  requiredScopes: [mcp.scope],
  resourceMetadataUrl,
};

export async function authenticateMcpRequest(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const auth = await verifyBearerToken(
      request.headers.authorization,
      bearerOptions,
    );
    (
      request.raw as typeof request.raw & {
        auth?: AuthInfo;
      }
    ).auth = auth;
    return true;
  } catch (error) {
    const response = bearerAuthChallengeResponse(error, bearerOptions);
    response.headers.forEach((value, name) => reply.header(name, value));
    const body = await response.text();
    reply.code(response.status).send(body);
    return false;
  }
}
