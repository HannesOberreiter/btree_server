import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import type { FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import type { ZodType } from 'zod';

import { ROLES } from '../../config/constants.config.js';
import {
  frontend,
  mcp,
  oauth,
  serverLocation,
  url,
} from '../../config/environment.config.js';
import { RedisServer } from '../../servers/redis.server.js';
import type { Database } from '../../types/database.types.js';
import {
  mcpOAuthAuthorizeQuerySchema,
  mcpOAuthRedirectQuerySchema,
  mcpOAuthRegistrationRequestSchema,
  mcpOAuthTokenRequestSchema,
} from '../schemas/mcp_oauth.schema.js';
import { isPremium } from './premium.module.js';

const AUTH_CODE_TTL_SECONDS = 600;
const CONSENT_TTL_SECONDS = 600;
const ACCESS_TOKEN_TYPE = 'mcp_access';
const CLIENT_ID_PREFIX = 'btree_mcp_client_';

interface McpOAuthClient {
  clientId: string;
  clientName: string;
  clientSecretHash: string | null;
  redirectUris: string[];
  tokenEndpointAuthMethod:
    | 'none'
    | 'client_secret_basic'
    | 'client_secret_post';
}

interface McpAuthorizationRequest {
  clientId: string;
  clientName: string;
  redirectUri: string;
  scope: string;
  state: string;
  resource: string;
  codeChallenge: string;
}

interface McpGrantPayload extends McpAuthorizationRequest {
  beeId: number;
  userId: number;
  rank: 1 | 2 | 3 | 4;
}

interface McpAccessTokenPayload extends jwt.JwtPayload {
  typ: typeof ACCESS_TOKEN_TYPE;
  client_id: string;
  bee_id: number;
  user_id: number;
  rank: 1 | 2 | 3 | 4;
  scope: string;
}

interface McpRefreshPayload {
  clientId: string;
  beeId: number;
  userId: number;
  rank: 1 | 2 | 3 | 4;
  scope: string;
  resource: string;
  tokenFamily?: string;
}

export interface McpClientCredentials {
  clientId: string;
  clientSecret?: string;
  authMethod: 'none' | 'client_secret_basic' | 'client_secret_post';
}

export class McpOAuthError extends Error {
  constructor(
    public readonly oauthCode: string,
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = 'McpOAuthError';
  }
}

function parseOrOAuthError<T>(schema: ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new McpOAuthError('invalid_request', 'Invalid OAuth request');
  }
  return parsed.data;
}

async function requireMcpOAuthAccess(
  db: Database,
  userId: number,
  beeId: number,
  oauthCode: 'access_denied' | 'invalid_grant',
) {
  const companyBee = await db
    .selectFrom('company_bee')
    .select('rank')
    .where('bee_id', '=', beeId)
    .where('user_id', '=', userId)
    .executeTakeFirst();
  const statusCode = oauthCode === 'access_denied' ? 403 : 400;

  if (
    companyBee?.rank !== ROLES.admin &&
    companyBee?.rank !== ROLES.user &&
    companyBee?.rank !== ROLES.read
  ) {
    throw new McpOAuthError(
      oauthCode,
      'MCP access requires company membership.',
      statusCode,
    );
  }

  if (!(await isPremium(userId, db))) {
    throw new McpOAuthError(
      oauthCode,
      'MCP access requires an active premium subscription.',
      statusCode,
    );
  }

  return companyBee.rank;
}

function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function hashesMatch(expectedHash: string, secret: string) {
  const actual = Buffer.from(hashToken(secret), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function authorizationCodeKey(code: string) {
  return `mcp-oauth:code:${code}`;
}

function consentKey(token: string) {
  return `mcp-oauth:consent:${token}`;
}

function isLoopbackHostname(hostname: string) {
  return ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname);
}

function validateRedirectUri(redirectUri: string) {
  let parsed: URL;
  try {
    parsed = new URL(redirectUri);
  } catch {
    throw new McpOAuthError('invalid_redirect_uri', 'Invalid redirect URI');
  }

  if (parsed.username || parsed.password || parsed.hash) {
    throw new McpOAuthError('invalid_redirect_uri', 'Invalid redirect URI');
  }

  const secure = parsed.protocol === 'https:';
  const loopback =
    parsed.protocol === 'http:' && isLoopbackHostname(parsed.hostname);
  if (!secure && !loopback) {
    throw new McpOAuthError('invalid_redirect_uri', 'Invalid redirect URI');
  }

  return parsed.toString();
}

function normalizeScope(scope: string | undefined) {
  const scopes = new Set((scope ?? mcp.scope).split(/\s+/).filter(Boolean));
  if (scopes.size !== 1 || !scopes.has(mcp.scope)) {
    throw new McpOAuthError('invalid_scope', 'Unsupported OAuth scope');
  }
  return mcp.scope;
}

function resolveMcpResource(resource: string | undefined) {
  const resolved = resource ?? mcp.resourceUrl;
  if (resolved !== mcp.resourceUrl) {
    throw new McpOAuthError(
      'invalid_target',
      'OAuth resource must match the MCP server',
    );
  }
  return resolved;
}

function configuredClient(): McpOAuthClient | undefined {
  if (!oauth.clientId || !oauth.clientSecret) return undefined;
  return {
    clientId: oauth.clientId,
    clientName: 'b.tree ChatGPT',
    clientSecretHash: hashToken(oauth.clientSecret),
    redirectUris: oauth.redirectUris,
    tokenEndpointAuthMethod: 'client_secret_post',
  };
}

async function findMcpClient(
  db: Database,
  clientId: string,
): Promise<McpOAuthClient | undefined> {
  const staticClient = configuredClient();
  if (staticClient?.clientId === clientId) return staticClient;

  const client = await db
    .selectFrom('agent_oauth_clients')
    .selectAll()
    .where('client_id', '=', clientId)
    .executeTakeFirst();
  if (!client) return undefined;

  let redirectUris: unknown = client.redirect_uris;
  if (typeof redirectUris === 'string') {
    try {
      redirectUris = JSON.parse(redirectUris);
    } catch {
      return undefined;
    }
  }
  if (
    !Array.isArray(redirectUris) ||
    !redirectUris.every((uri) => typeof uri === 'string')
  ) {
    return undefined;
  }

  if (
    !['none', 'client_secret_basic', 'client_secret_post'].includes(
      client.token_endpoint_auth_method,
    )
  ) {
    return undefined;
  }

  return {
    clientId: client.client_id,
    clientName: client.client_name,
    clientSecretHash: client.client_secret_hash,
    redirectUris,
    tokenEndpointAuthMethod: client.token_endpoint_auth_method as
      | 'none'
      | 'client_secret_basic'
      | 'client_secret_post',
  };
}

async function authenticateClient(
  db: Database,
  credentials: McpClientCredentials,
) {
  const client = await findMcpClient(db, credentials.clientId);
  if (!client) {
    throw new McpOAuthError('invalid_client', 'Invalid OAuth client', 401);
  }

  if (client.tokenEndpointAuthMethod !== credentials.authMethod) {
    throw new McpOAuthError('invalid_client', 'Invalid OAuth client', 401);
  }

  if (client.tokenEndpointAuthMethod === 'none') {
    if (credentials.clientSecret) {
      throw new McpOAuthError('invalid_client', 'Invalid OAuth client', 401);
    }
    return client;
  }

  if (
    !client.clientSecretHash ||
    !credentials.clientSecret ||
    !hashesMatch(client.clientSecretHash, credentials.clientSecret)
  ) {
    throw new McpOAuthError('invalid_client', 'Invalid OAuth client', 401);
  }

  return client;
}

function buildAccessToken(payload: McpRefreshPayload) {
  return jwt.sign(
    {
      typ: ACCESS_TOKEN_TYPE,
      client_id: payload.clientId,
      bee_id: payload.beeId,
      user_id: payload.userId,
      rank: payload.rank,
      scope: payload.scope,
    },
    mcp.accessTokenSecret,
    {
      algorithm: 'HS256',
      audience: mcp.resourceUrl,
      issuer: mcp.issuer,
      subject: String(payload.userId),
      jwtid: randomToken(16),
      expiresIn: mcp.accessTokenExpiresIn,
    },
  );
}

async function insertRefreshToken(db: Database, payload: McpRefreshPayload) {
  const refreshToken = randomToken(48);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + mcp.refreshTokenDays);

  await db
    .insertInto('agent_oauth_refresh_tokens')
    .values({
      client_id: payload.clientId,
      token_hash: hashToken(refreshToken),
      token_family: payload.tokenFamily ?? randomToken(16),
      bee_id: payload.beeId,
      user_id: payload.userId,
      scope: payload.scope,
      resource: payload.resource,
      expires_at: expiresAt,
    })
    .executeTakeFirstOrThrow();

  return refreshToken;
}

async function createTokenPair(db: Database, payload: McpRefreshPayload) {
  return {
    access_token: buildAccessToken(payload),
    token_type: 'Bearer',
    refresh_token: await insertRefreshToken(db, payload),
    expires_in: mcp.accessTokenExpiresIn,
    scope: payload.scope,
  };
}

async function revokeMcpRefreshFamily(
  db: Database,
  token: {
    clientId: string;
    userId: number;
    beeId: number;
    resource: string;
    tokenFamily: string | null;
  },
) {
  let query = db
    .updateTable('agent_oauth_refresh_tokens')
    .set({ revoked_at: new Date() })
    .where('client_id', '=', token.clientId)
    .where('user_id', '=', token.userId)
    .where('bee_id', '=', token.beeId)
    .where('resource', '=', token.resource)
    .where('revoked_at', 'is', null);
  if (token.tokenFamily) {
    query = query.where('token_family', '=', token.tokenFamily);
  }
  await query.execute();
}

export async function listMcpConnections(
  db: Database,
  user: { user_id: number; bee_id: number },
) {
  const rows = await db
    .selectFrom('agent_oauth_refresh_tokens')
    .leftJoin(
      'agent_oauth_clients',
      'agent_oauth_clients.client_id',
      'agent_oauth_refresh_tokens.client_id',
    )
    .select([
      'agent_oauth_refresh_tokens.token_family',
      'agent_oauth_refresh_tokens.client_id',
      'agent_oauth_refresh_tokens.created_at',
      'agent_oauth_refresh_tokens.last_used_at',
      'agent_oauth_refresh_tokens.expires_at',
      'agent_oauth_refresh_tokens.revoked_at',
      'agent_oauth_clients.client_name as registered_client_name',
    ])
    .where('agent_oauth_refresh_tokens.user_id', '=', user.user_id)
    .where('agent_oauth_refresh_tokens.bee_id', '=', user.bee_id)
    .where('agent_oauth_refresh_tokens.resource', '=', mcp.resourceUrl)
    .where('agent_oauth_refresh_tokens.token_family', 'is not', null)
    .orderBy('agent_oauth_refresh_tokens.created_at', 'asc')
    .execute();

  const now = Date.now();
  const connections = new Map<
    string,
    {
      token_family: string;
      client_id: string;
      client_name: string;
      created_at: Date;
      last_used_at: Date | null;
      expires_at: Date;
      active: boolean;
    }
  >();

  for (const row of rows) {
    if (!row.token_family) continue;
    const existing = connections.get(row.token_family);
    const createdAt = new Date(row.created_at);
    const lastUsedAt = row.last_used_at ? new Date(row.last_used_at) : null;
    const expiresAt = new Date(row.expires_at);
    const active = !row.revoked_at && expiresAt.getTime() >= now;
    if (!existing) {
      connections.set(row.token_family, {
        token_family: row.token_family,
        client_id: row.client_id,
        client_name:
          row.registered_client_name ??
          (row.client_id === oauth.clientId ? 'b.tree ChatGPT' : row.client_id),
        created_at: createdAt,
        last_used_at: lastUsedAt,
        expires_at: expiresAt,
        active,
      });
      continue;
    }
    if (
      lastUsedAt &&
      (!existing.last_used_at || lastUsedAt > existing.last_used_at)
    ) {
      existing.last_used_at = lastUsedAt;
    }
    if (active) {
      existing.active = true;
      existing.expires_at = expiresAt;
    }
  }

  return [...connections.values()]
    .filter((connection) => connection.active)
    .sort(
      (left, right) => right.created_at.getTime() - left.created_at.getTime(),
    )
    .map(({ active: _active, ...connection }) => connection);
}

export async function revokeMcpConnection(
  db: Database,
  user: { user_id: number; bee_id: number },
  tokenFamily?: string,
) {
  let query = db
    .updateTable('agent_oauth_refresh_tokens')
    .set({ revoked_at: new Date() })
    .where('user_id', '=', user.user_id)
    .where('bee_id', '=', user.bee_id)
    .where('resource', '=', mcp.resourceUrl)
    .where('revoked_at', 'is', null);
  if (tokenFamily) query = query.where('token_family', '=', tokenFamily);
  const result = await query.executeTakeFirst();
  return Number(result.numUpdatedRows);
}

export async function registerMcpOAuthClient(db: Database, input: unknown) {
  const registration = parseOrOAuthError(
    mcpOAuthRegistrationRequestSchema,
    input,
  );
  const grantTypes = registration.grant_types ?? [
    'authorization_code',
    'refresh_token',
  ];
  const responseTypes = registration.response_types ?? ['code'];
  if (
    !grantTypes.includes('authorization_code') ||
    grantTypes.some(
      (grantType) =>
        grantType !== 'authorization_code' && grantType !== 'refresh_token',
    ) ||
    responseTypes.length !== 1 ||
    responseTypes[0] !== 'code'
  ) {
    throw new McpOAuthError(
      'invalid_client_metadata',
      'Unsupported OAuth client metadata',
    );
  }

  const redirectUris = registration.redirect_uris.map(validateRedirectUri);
  const clientId = `${CLIENT_ID_PREFIX}${randomToken(24)}`;
  const authMethod = registration.token_endpoint_auth_method;
  const clientSecret = authMethod === 'none' ? undefined : randomToken(48);

  await db
    .insertInto('agent_oauth_clients')
    .values({
      client_id: clientId,
      client_name: registration.client_name ?? 'MCP client',
      client_secret_hash: clientSecret ? hashToken(clientSecret) : null,
      redirect_uris: JSON.stringify(redirectUris),
      token_endpoint_auth_method: authMethod,
    })
    .executeTakeFirstOrThrow();

  return {
    client_id: clientId,
    ...(clientSecret
      ? { client_secret: clientSecret, client_secret_expires_at: 0 }
      : {}),
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: registration.client_name ?? 'MCP client',
    redirect_uris: redirectUris,
    grant_types: grantTypes,
    response_types: ['code'],
    token_endpoint_auth_method: authMethod,
  };
}

export async function getMcpAuthorizationRequest(
  db: Database,
  query: unknown,
): Promise<McpAuthorizationRequest> {
  const request = parseOrOAuthError(mcpOAuthAuthorizeQuerySchema, query);
  const client = await findMcpClient(db, request.client_id);
  if (!client) {
    throw new McpOAuthError('unauthorized_client', 'Unknown OAuth client');
  }

  const redirectUri = validateRedirectUri(request.redirect_uri);
  if (!client.redirectUris.includes(redirectUri)) {
    throw new McpOAuthError('invalid_request', 'Invalid redirect_uri');
  }

  return {
    clientId: client.clientId,
    clientName: client.clientName,
    redirectUri,
    scope: normalizeScope(request.scope),
    state: request.state,
    resource: resolveMcpResource(request.resource),
    codeChallenge: request.code_challenge,
  };
}

export async function getMcpAuthorizationErrorRedirect(
  db: Database,
  query: unknown,
  error: unknown,
) {
  if (!(error instanceof McpOAuthError)) return undefined;

  const request = mcpOAuthRedirectQuerySchema.safeParse(query);
  if (!request.success) return undefined;

  const client = await findMcpClient(db, request.data.client_id);
  if (!client) return undefined;

  let redirectUri: string;
  try {
    redirectUri = validateRedirectUri(request.data.redirect_uri);
  } catch {
    return undefined;
  }
  if (!client.redirectUris.includes(redirectUri)) return undefined;

  const redirect = new URL(redirectUri);
  redirect.searchParams.set('error', error.oauthCode);
  redirect.searchParams.set('error_description', error.message);
  redirect.searchParams.set('state', request.data.state);
  redirect.searchParams.set('iss', mcp.issuer);
  return redirect.toString();
}

export async function createMcpConsentRequest(
  db: Database,
  authorization: McpAuthorizationRequest,
  user: { user_id: number; bee_id: number },
) {
  const rank = await requireMcpOAuthAccess(
    db,
    user.user_id,
    user.bee_id,
    'access_denied',
  );
  const token = randomToken();
  const pending: McpGrantPayload = {
    ...authorization,
    userId: user.user_id,
    beeId: user.bee_id,
    rank,
  };
  await RedisServer.client.setEx(
    consentKey(token),
    CONSENT_TTL_SECONDS,
    JSON.stringify(pending),
  );
  return { token, pending };
}

export async function finishMcpConsent(
  db: Database,
  token: string,
  approved: boolean,
  user: { user_id: number; bee_id: number },
) {
  const raw = await RedisServer.client.getDel(consentKey(token));
  if (!raw) {
    throw new McpOAuthError('invalid_request', 'Invalid or expired consent');
  }

  const pending = JSON.parse(
    typeof raw === 'string' ? raw : raw.toString(),
  ) as McpGrantPayload;
  if (pending.userId !== user.user_id || pending.beeId !== user.bee_id) {
    throw new McpOAuthError('access_denied', 'Consent belongs to another user');
  }

  const redirect = new URL(pending.redirectUri);
  redirect.searchParams.set('state', pending.state);
  redirect.searchParams.set('iss', mcp.issuer);

  if (!approved) {
    redirect.searchParams.set('error', 'access_denied');
    return redirect.toString();
  }

  let rank: 1 | 2 | 3;
  try {
    rank = await requireMcpOAuthAccess(
      db,
      pending.userId,
      pending.beeId,
      'access_denied',
    );
  } catch (error) {
    if (error instanceof McpOAuthError) {
      redirect.searchParams.set('error', error.oauthCode);
      redirect.searchParams.set('error_description', error.message);
      return redirect.toString();
    }
    throw error;
  }
  const code = randomToken();
  await RedisServer.client.setEx(
    authorizationCodeKey(code),
    AUTH_CODE_TTL_SECONDS,
    JSON.stringify({ ...pending, rank }),
  );
  redirect.searchParams.set('code', code);
  return redirect.toString();
}

export function getMcpOAuthLoginRedirect(request: FastifyRequest) {
  const authorizeUrl = new URL(request.url, url);
  const loginUrl = new URL('/visitor/login', frontend);
  loginUrl.searchParams.set('next', authorizeUrl.toString());
  loginUrl.searchParams.set('oauth', '1');
  loginUrl.searchParams.set('server', serverLocation);
  return loginUrl.toString();
}

export async function exchangeMcpAuthorizationCode(
  db: Database,
  input: unknown,
  credentials: McpClientCredentials,
) {
  const request = parseOrOAuthError(mcpOAuthTokenRequestSchema, input);
  if (
    request.grant_type !== 'authorization_code' ||
    !request.code ||
    !request.redirect_uri ||
    !request.code_verifier
  ) {
    throw new McpOAuthError('invalid_request', 'Incomplete token request');
  }

  const client = await authenticateClient(db, credentials);
  const resource = resolveMcpResource(request.resource);
  const raw = await RedisServer.client.getDel(
    authorizationCodeKey(request.code),
  );
  if (!raw) {
    throw new McpOAuthError('invalid_grant', 'Invalid authorization code');
  }

  const grant = JSON.parse(
    typeof raw === 'string' ? raw : raw.toString(),
  ) as McpGrantPayload;
  const redirectUri = validateRedirectUri(request.redirect_uri);
  const challenge = createHash('sha256')
    .update(request.code_verifier)
    .digest('base64url');
  if (
    grant.clientId !== client.clientId ||
    grant.redirectUri !== redirectUri ||
    grant.resource !== resource ||
    challenge !== grant.codeChallenge
  ) {
    throw new McpOAuthError('invalid_grant', 'Invalid authorization code');
  }

  const rank = await requireMcpOAuthAccess(
    db,
    grant.userId,
    grant.beeId,
    'invalid_grant',
  );
  await db
    .updateTable('agent_oauth_clients')
    .set({ last_used_at: new Date() })
    .where('client_id', '=', client.clientId)
    .executeTakeFirst();

  return createTokenPair(db, {
    clientId: grant.clientId,
    userId: grant.userId,
    beeId: grant.beeId,
    rank,
    scope: grant.scope,
    resource: grant.resource,
  });
}

export async function refreshMcpAccessToken(
  db: Database,
  input: unknown,
  credentials: McpClientCredentials,
) {
  const request = parseOrOAuthError(mcpOAuthTokenRequestSchema, input);
  if (request.grant_type !== 'refresh_token' || !request.refresh_token) {
    throw new McpOAuthError('invalid_request', 'Incomplete refresh request');
  }

  const client = await authenticateClient(db, credentials);
  const resource = resolveMcpResource(request.resource);
  const stored = await db
    .selectFrom('agent_oauth_refresh_tokens')
    .selectAll()
    .where('token_hash', '=', hashToken(request.refresh_token))
    .where('client_id', '=', client.clientId)
    .where('resource', '=', resource)
    .executeTakeFirst();
  if (!stored) {
    throw new McpOAuthError('invalid_grant', 'Invalid refresh token');
  }

  const family = {
    clientId: client.clientId,
    userId: stored.user_id,
    beeId: stored.bee_id,
    resource,
    tokenFamily: stored.token_family,
  };
  if (stored.revoked_at) {
    await revokeMcpRefreshFamily(db, family);
    throw new McpOAuthError('invalid_grant', 'Invalid refresh token');
  }
  if (new Date(stored.expires_at) < new Date()) {
    throw new McpOAuthError('invalid_grant', 'Invalid refresh token');
  }

  const rank = await requireMcpOAuthAccess(
    db,
    stored.user_id,
    stored.bee_id,
    'invalid_grant',
  );
  const payload: McpRefreshPayload = {
    clientId: client.clientId,
    userId: stored.user_id,
    beeId: stored.bee_id,
    rank,
    scope: stored.scope ?? mcp.scope,
    resource,
    tokenFamily: stored.token_family ?? randomToken(16),
  };

  const rotated = await db.transaction().execute(async (transaction) => {
    const revoked = await transaction
      .updateTable('agent_oauth_refresh_tokens')
      .set({ revoked_at: new Date(), last_used_at: new Date() })
      .where('id', '=', stored.id)
      .where('revoked_at', 'is', null)
      .executeTakeFirst();
    if (revoked.numUpdatedRows !== 1n) return undefined;
    return createTokenPair(transaction, payload);
  });
  if (!rotated) {
    await revokeMcpRefreshFamily(db, family);
    throw new McpOAuthError('invalid_grant', 'Invalid refresh token');
  }
  return rotated;
}

export function verifyMcpAccessToken(token: string) {
  if (!mcp.accessTokenSecret) {
    throw new McpOAuthError('server_error', 'MCP OAuth is not configured', 500);
  }

  const decoded = jwt.verify(token, mcp.accessTokenSecret, {
    algorithms: ['HS256'],
    audience: mcp.resourceUrl,
    issuer: mcp.issuer,
  });
  if (!decoded || typeof decoded === 'string') {
    throw new McpOAuthError('invalid_token', 'Invalid access token', 401);
  }

  const payload = decoded as McpAccessTokenPayload;
  if (
    payload.typ !== ACCESS_TOKEN_TYPE ||
    typeof payload.client_id !== 'string' ||
    typeof payload.user_id !== 'number' ||
    typeof payload.bee_id !== 'number' ||
    typeof payload.exp !== 'number' ||
    typeof payload.scope !== 'string'
  ) {
    throw new McpOAuthError('invalid_token', 'Invalid access token', 401);
  }

  return payload;
}
