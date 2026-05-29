import { createHash, randomBytes } from 'node:crypto';

import type { FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';
import jwt from 'jsonwebtoken';

import {
  frontend,
  oauth,
  serverLocation,
  url,
} from '../../config/environment.config.js';
import { KyselyServer } from '../../servers/kysely.server.js';
import { RedisServer } from '../../servers/redis.server.js';

const AUTH_CODE_TTL_SECONDS = 600;
const TOKEN_TYPE = 'bearer';
const ACCESS_TOKEN_PREFIX = 'btree_oauth_';

type OAuthCodePayload = {
  clientId: string;
  redirectUri: string;
  scope: string;
  beeId: number;
  userId: number;
  rank: 1 | 2 | 3 | 4;
};

type AgentOAuthJwtPayload = jwt.JwtPayload & {
  typ: 'agent_oauth';
  bee_id: number;
  user_id: number;
  rank: 1 | 2 | 3 | 4;
  scope: string;
};

type TokenPair = {
  access_token: string;
  token_type: typeof TOKEN_TYPE;
  refresh_token: string;
  expires_in: number;
};

function requireOAuthConfig() {
  if (!oauth.clientId || !oauth.clientSecret || !oauth.accessTokenSecret) {
    throw httpErrors.InternalServerError('OAuth is not configured');
  }
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

function redisCodeKey(code: string) {
  return `agent-oauth:code:${code}`;
}

function isRedirectUriAllowed(redirectUri: string) {
  return oauth.redirectUris.includes(redirectUri);
}

function validateClient(clientId: string, clientSecret?: string) {
  requireOAuthConfig();
  if (clientId !== oauth.clientId) {
    throw httpErrors.Unauthorized('Invalid OAuth client');
  }
  if (clientSecret !== undefined && clientSecret !== oauth.clientSecret) {
    throw httpErrors.Unauthorized('Invalid OAuth client');
  }
}

function buildLoginRedirect(request: FastifyRequest) {
  const authorizeUrl = new URL(`${url}/api/v1/agent/oauth/authorize`);
  const requestUrl = new URL(request.url, `${url}/api/v1/agent`);
  authorizeUrl.search = requestUrl.search;

  const loginUrl = new URL('/visitor/login', frontend);
  loginUrl.searchParams.set('next', authorizeUrl.toString());
  loginUrl.searchParams.set('oauth', '1');
  loginUrl.searchParams.set('server', serverLocation);
  return loginUrl.toString();
}

function buildAccessToken(payload: OAuthCodePayload) {
  const token = jwt.sign(
    {
      typ: 'agent_oauth',
      bee_id: payload.beeId,
      user_id: payload.userId,
      rank: payload.rank,
      scope: payload.scope,
    },
    oauth.accessTokenSecret,
    {
      audience: oauth.clientId,
      issuer: 'btree-agent-oauth',
      expiresIn: oauth.accessTokenExpiresIn,
    },
  );

  return `${ACCESS_TOKEN_PREFIX}${token}`;
}

async function createRefreshToken(payload: OAuthCodePayload) {
  const token = randomToken(48);
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + oauth.refreshTokenDays);

  await KyselyServer.getInstance()
    .db.insertInto('agent_oauth_refresh_tokens')
    .values({
      client_id: payload.clientId,
      token_hash: tokenHash,
      bee_id: payload.beeId,
      user_id: payload.userId,
      scope: payload.scope,
      expires_at: expiresAt,
    })
    .executeTakeFirstOrThrow();

  return token;
}

async function createTokenPair(payload: OAuthCodePayload): Promise<TokenPair> {
  const accessToken = buildAccessToken(payload);
  const refreshToken = await createRefreshToken(payload);
  return {
    access_token: accessToken,
    token_type: TOKEN_TYPE,
    refresh_token: refreshToken,
    expires_in: oauth.accessTokenExpiresIn,
  };
}

export function verifyAgentOAuthAccessToken(token: string) {
  requireOAuthConfig();
  if (!token.startsWith(ACCESS_TOKEN_PREFIX)) {
    throw httpErrors.Unauthorized('Invalid OAuth token');
  }

  const jwtToken = token.slice(ACCESS_TOKEN_PREFIX.length);
  const decoded = jwt.verify(jwtToken, oauth.accessTokenSecret, {
    audience: oauth.clientId,
    issuer: 'btree-agent-oauth',
  });

  if (!decoded || typeof decoded === 'string') {
    throw httpErrors.Unauthorized('Invalid OAuth token');
  }

  const payload = decoded as AgentOAuthJwtPayload;
  if (
    payload.typ !== 'agent_oauth' ||
    typeof payload.bee_id !== 'number' ||
    typeof payload.user_id !== 'number'
  ) {
    throw httpErrors.Unauthorized('Invalid OAuth token');
  }

  return {
    beeId: payload.bee_id,
    userId: payload.user_id,
    rank: payload.rank,
  };
}

export async function createAuthorizationCode(payload: OAuthCodePayload) {
  const code = randomToken();
  await RedisServer.client.setEx(
    redisCodeKey(code),
    AUTH_CODE_TTL_SECONDS,
    JSON.stringify(payload),
  );
  return code;
}

export async function exchangeAuthorizationCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
) {
  validateClient(clientId, clientSecret);
  if (!isRedirectUriAllowed(redirectUri)) {
    throw httpErrors.BadRequest('Invalid redirect_uri');
  }

  const key = redisCodeKey(code);
  const raw = await RedisServer.client.get(key);
  if (!raw) {
    throw httpErrors.BadRequest('Invalid authorization code');
  }
  await RedisServer.client.del(key);

  const payload = JSON.parse(String(raw)) as OAuthCodePayload;
  if (payload.clientId !== clientId || payload.redirectUri !== redirectUri) {
    throw httpErrors.BadRequest('Invalid authorization code');
  }

  return createTokenPair(payload);
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
) {
  validateClient(clientId, clientSecret);
  const tokenHash = hashToken(refreshToken);
  const db = KyselyServer.getInstance().db;
  const stored = await db
    .selectFrom('agent_oauth_refresh_tokens')
    .selectAll()
    .where('token_hash', '=', tokenHash)
    .where('client_id', '=', clientId)
    .where('revoked_at', 'is', null)
    .executeTakeFirst();

  if (!stored || new Date(stored.expires_at) < new Date()) {
    throw httpErrors.Unauthorized('Invalid refresh token');
  }

  const companyBee = await db
    .selectFrom('company_bee')
    .select(['rank'])
    .where('bee_id', '=', stored.bee_id)
    .where('user_id', '=', stored.user_id)
    .executeTakeFirst();

  if (!companyBee?.rank) {
    throw httpErrors.Unauthorized('User no longer has company access');
  }

  await db
    .updateTable('agent_oauth_refresh_tokens')
    .set({ last_used_at: new Date() })
    .where('id', '=', stored.id)
    .executeTakeFirst();

  const accessToken = buildAccessToken({
    clientId,
    beeId: stored.bee_id,
    userId: stored.user_id,
    rank: companyBee.rank as 1 | 2 | 3 | 4,
    scope: stored.scope ?? oauth.scope,
    redirectUri: '',
  });

  return {
    access_token: accessToken,
    token_type: TOKEN_TYPE,
    refresh_token: refreshToken,
    expires_in: oauth.accessTokenExpiresIn,
  };
}

export function getOAuthAuthorizeData(request: FastifyRequest) {
  const query = request.query as {
    client_id?: string;
    redirect_uri?: string;
    response_type?: string;
    scope?: string;
    state?: string;
  };

  const clientId = query.client_id ?? '';
  const redirectUri = query.redirect_uri ?? '';
  validateClient(clientId);

  if (query.response_type !== 'code') {
    throw httpErrors.BadRequest('Unsupported response_type');
  }
  if (!query.state) {
    throw httpErrors.BadRequest('Missing state');
  }
  if (!isRedirectUriAllowed(redirectUri)) {
    throw httpErrors.BadRequest('Invalid redirect_uri');
  }

  return {
    clientId,
    redirectUri,
    scope: query.scope || oauth.scope,
    state: query.state,
  };
}

export function getOAuthLoginRedirect(request: FastifyRequest) {
  return buildLoginRedirect(request);
}
