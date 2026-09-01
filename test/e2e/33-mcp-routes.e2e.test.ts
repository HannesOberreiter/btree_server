import { createHash } from 'node:crypto';
import process from 'node:process';

import { beforeAll, describe, expect, it } from 'vitest';

import { wizBeeToolDefinitions } from '../../src/api/modules/wizbee_tools.module.js';
import { ROLES } from '../../src/config/constants.config.js';
import { KyselyServer } from '../../src/servers/kysely.server.js';
import type { TestAgent } from '../utils.js';
import { createAgent, demoUser, doRequest } from '../utils.js';

const mcpResource = `http://localhost:${process.env.PORT}/api/v1/mcp`;
const redirectUri = 'http://127.0.0.1:49152/callback';
const codeVerifier =
  'btree-mcp-e2e-code-verifier-012345678901234567890123456789';
const codeChallenge = createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

interface HttpResponse {
  status: number;
  body: unknown;
  headers: Headers;
}

async function jsonRequest(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<HttpResponse> {
  const response = await fetch(`http://localhost:${process.env.PORT}${path}`, {
    method,
    headers: {
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
      Origin: process.env.ORIGIN!,
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
  });
  const text = await response.text();
  let responseBody: unknown = text;
  const contentType = response.headers.get('content-type');
  if (text && contentType?.includes('json')) {
    responseBody = JSON.parse(text) as unknown;
  } else if (text && contentType?.includes('text/event-stream')) {
    const dataLine = text
      .split(/\r?\n/)
      .find((line) => line.startsWith('data: '));
    if (dataLine) responseBody = JSON.parse(dataLine.slice(6)) as unknown;
  }
  return {
    status: response.status,
    body: responseBody,
    headers: response.headers,
  };
}

function modernParams() {
  return {
    _meta: {
      'io.modelcontextprotocol/protocolVersion': '2026-07-28',
      'io.modelcontextprotocol/clientInfo': {
        name: 'btree-e2e',
        version: '1.0.0',
      },
      'io.modelcontextprotocol/clientCapabilities': {},
    },
  };
}

function objectBody(response: HttpResponse) {
  expect(response.body).toBeTypeOf('object');
  expect(response.body).not.toBeNull();
  return response.body as Record<string, unknown>;
}

describe('remote MCP routes', () => {
  let agent: TestAgent;
  let clientId: string;
  let accessToken: string;
  let refreshToken: string;
  let companyId: number;
  let beeId: number;

  beforeAll(async () => {
    agent = createAgent();
    const login = await doRequest(
      agent,
      'post',
      '/api/v1/auth/login',
      null,
      null,
      demoUser,
    );
    expect(login.statusCode).toBe(200);

    const registration = await jsonRequest(
      'POST',
      '/api/v1/mcp/oauth/register',
      {
        client_name: 'b.tree MCP E2E',
        redirect_uris: [redirectUri],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none',
      },
    );
    expect(registration.status).toBe(201);
    clientId = objectBody(registration).client_id as string;

    const authorizeQuery = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'mcp',
      state: 'mcp-e2e-state',
      resource: mcpResource,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    const authorization = await agent.request(
      'GET',
      `/api/v1/mcp/oauth/authorize?${authorizeQuery.toString()}`,
      undefined,
      undefined,
      'manual',
    );
    expect(authorization.statusCode).toBe(200);
    const consentToken = String(authorization.body).match(
      /name="consent_token" value="([A-Za-z0-9_-]+)"/,
    )?.[1];
    expect(consentToken).toBeTruthy();

    const consent = await agent.request(
      'POST',
      '/api/v1/mcp/oauth/authorize',
      { consent_token: consentToken, decision: 'approve' },
      undefined,
      'manual',
    );
    expect(consent.statusCode).toBe(302);
    const callback = new URL(consent.headers.location);
    expect(callback.searchParams.get('state')).toBe('mcp-e2e-state');
    expect(callback.searchParams.get('iss')).toBe(
      `http://localhost:${process.env.PORT}`,
    );
    const code = callback.searchParams.get('code');
    expect(code).toBeTruthy();

    const token = await jsonRequest('POST', '/api/v1/mcp/oauth/token', {
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      resource: mcpResource,
    });
    expect(token.status).toBe(200);
    const tokenBody = objectBody(token);
    accessToken = tokenBody.access_token as string;
    refreshToken = tokenBody.refresh_token as string;
    const accessPayload = JSON.parse(
      Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'),
    ) as Record<string, number>;
    companyId = accessPayload.user_id;
    beeId = accessPayload.bee_id;
  });

  it('publishes protected-resource and authorization-server metadata', async () => {
    const resource = await jsonRequest(
      'GET',
      '/.well-known/oauth-protected-resource/api/v1/mcp',
    );
    expect(resource.status).toBe(200);
    expect(objectBody(resource)).toMatchObject({
      resource: mcpResource,
      authorization_servers: [`http://localhost:${process.env.PORT}`],
      scopes_supported: ['mcp'],
    });

    const authorization = await jsonRequest(
      'GET',
      '/.well-known/oauth-authorization-server',
    );
    expect(authorization.status).toBe(200);
    expect(objectBody(authorization)).toMatchObject({
      issuer: `http://localhost:${process.env.PORT}`,
      code_challenge_methods_supported: ['S256'],
      scopes_supported: ['mcp'],
    });
  });

  it('allows opaque browser origins to enter OAuth authorization', async () => {
    const authorizeQuery = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'mcp',
      state: 'opaque-origin-state',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    const authorization = await jsonRequest(
      'GET',
      `/api/v1/mcp/oauth/authorize?${authorizeQuery.toString()}`,
      undefined,
      { Origin: 'null' },
    );
    expect(authorization.status).toBe(302);
    expect(authorization.body).not.toEqual(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Invalid Origin header: null',
        }),
      }),
    );
  });

  it('rejects opaque origins on the MCP transport', async () => {
    const response = await jsonRequest(
      'POST',
      '/api/v1/mcp',
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: modernParams(),
      },
      { Origin: 'null' },
    );
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Invalid Origin header: null',
      },
      id: null,
    });
  });

  it('defaults an omitted OAuth resource to the MCP endpoint', async () => {
    const authorizeQuery = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'mcp',
      state: 'legacy-client-state',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    const authorization = await agent.request(
      'GET',
      `/api/v1/mcp/oauth/authorize?${authorizeQuery.toString()}`,
      undefined,
      undefined,
      'manual',
    );
    expect(authorization.statusCode).toBe(200);
    const consentToken = String(authorization.body).match(
      /name="consent_token" value="([A-Za-z0-9_-]+)"/,
    )?.[1];
    expect(consentToken).toBeTruthy();

    const consent = await agent.request(
      'POST',
      '/api/v1/mcp/oauth/authorize',
      { consent_token: consentToken, decision: 'approve' },
      undefined,
      'manual',
    );
    expect(consent.statusCode).toBe(302);
    const code = new URL(consent.headers.location).searchParams.get('code');
    expect(code).toBeTruthy();

    const token = await jsonRequest('POST', '/api/v1/mcp/oauth/token', {
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });
    expect(token.status).toBe(200);
    const claims = JSON.parse(
      Buffer.from(
        String(objectBody(token).access_token).split('.')[1],
        'base64url',
      ).toString('utf8'),
    ) as Record<string, unknown>;
    expect(claims.aud).toBe(mcpResource);
  });

  it('rejects a mismatched OAuth resource', async () => {
    const authorizeQuery = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'mcp',
      state: 'wrong-resource-state',
      resource: 'https://example.com/api/v1/mcp',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    const authorization = await agent.request(
      'GET',
      `/api/v1/mcp/oauth/authorize?${authorizeQuery.toString()}`,
      undefined,
      undefined,
      'manual',
    );
    expect(authorization.statusCode).toBe(302);
    const callback = new URL(authorization.headers.location);
    expect(callback.searchParams.get('error')).toBe('invalid_target');
    expect(callback.searchParams.get('state')).toBe('wrong-resource-state');
  });

  it('lists active MCP connections only for the signed-in user', async () => {
    const unauthorized = await jsonRequest('GET', '/api/v1/mcp/connections');
    expect(unauthorized.status).toBe(401);

    const response = await agent.request('GET', '/api/v1/mcp/connections');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          client_id: clientId,
          client_name: 'b.tree MCP E2E',
        }),
      ]),
    );
  });

  it('challenges unauthenticated MCP requests with resource metadata', async () => {
    const response = await jsonRequest(
      'POST',
      '/api/v1/mcp',
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: modernParams(),
      },
      {
        'MCP-Protocol-Version': '2026-07-28',
        'Mcp-Method': 'tools/list',
      },
    );
    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toContain(
      '/.well-known/oauth-protected-resource/api/v1/mcp',
    );
    expect(response.headers.get('access-control-expose-headers')).toContain(
      'WWW-Authenticate',
    );
  });

  it('redirects authorization errors after validating the callback', async () => {
    const query = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'unsupported',
      state: 'invalid-scope-state',
      resource: mcpResource,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    const response = await agent.request(
      'GET',
      `/api/v1/mcp/oauth/authorize?${query.toString()}`,
      undefined,
      undefined,
      'manual',
    );
    expect(response.statusCode).toBe(302);
    const callback = new URL(response.headers.location);
    expect(callback.origin + callback.pathname).toBe(redirectUri);
    expect(callback.searchParams.get('error')).toBe('invalid_scope');
    expect(callback.searchParams.get('state')).toBe('invalid-scope-state');
  });

  it('maps authorization schema failures to OAuth redirects', async () => {
    const query = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'mcp',
      state: 'invalid-request-state',
      resource: mcpResource,
      code_challenge_method: 'S256',
    });
    const response = await agent.request(
      'GET',
      `/api/v1/mcp/oauth/authorize?${query.toString()}`,
      undefined,
      undefined,
      'manual',
    );
    expect(response.statusCode).toBe(302);
    const callback = new URL(response.headers.location);
    expect(callback.searchParams.get('error')).toBe('invalid_request');
    expect(callback.searchParams.get('state')).toBe('invalid-request-state');
  });

  it('allows read-only members to authorize MCP', async () => {
    const db = KyselyServer.getInstance().db;
    const original = await db
      .selectFrom('company_bee')
      .select('rank')
      .where('user_id', '=', companyId)
      .where('bee_id', '=', beeId)
      .executeTakeFirstOrThrow();

    try {
      await db
        .updateTable('company_bee')
        .set({ rank: ROLES.read })
        .where('user_id', '=', companyId)
        .where('bee_id', '=', beeId)
        .executeTakeFirst();
      const query = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'mcp',
        state: 'read-only-state',
        resource: mcpResource,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });
      const response = await agent.request(
        'GET',
        `/api/v1/mcp/oauth/authorize?${query.toString()}`,
        undefined,
        undefined,
        'manual',
      );
      expect(response.statusCode).toBe(200);
      expect(String(response.body)).toContain('Authorize b.tree MCP');
    } finally {
      await db
        .updateTable('company_bee')
        .set({ rank: original.rank })
        .where('user_id', '=', companyId)
        .where('bee_id', '=', beeId)
        .executeTakeFirst();
    }
  });

  it('redirects lost membership as an authorization error', async () => {
    const db = KyselyServer.getInstance().db;
    const original = await db
      .selectFrom('company_bee')
      .select('rank')
      .where('user_id', '=', companyId)
      .where('bee_id', '=', beeId)
      .executeTakeFirstOrThrow();

    try {
      await db
        .updateTable('company_bee')
        .set({ rank: ROLES.ghost })
        .where('user_id', '=', companyId)
        .where('bee_id', '=', beeId)
        .executeTakeFirst();
      const query = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'mcp',
        state: 'lost-membership-state',
        resource: mcpResource,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });
      const response = await agent.request(
        'GET',
        `/api/v1/mcp/oauth/authorize?${query.toString()}`,
        undefined,
        undefined,
        'manual',
      );
      expect(response.statusCode).toBe(302);
      const callback = new URL(response.headers.location);
      expect(callback.searchParams.get('error')).toBe('access_denied');
      expect(callback.searchParams.get('state')).toBe('lost-membership-state');
    } finally {
      await db
        .updateTable('company_bee')
        .set({ rank: original.rank })
        .where('user_id', '=', companyId)
        .where('bee_id', '=', beeId)
        .executeTakeFirst();
    }
  });

  it('redirects access loss while consent is pending', async () => {
    const query = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'mcp',
      state: 'pending-consent-state',
      resource: mcpResource,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    const authorization = await agent.request(
      'GET',
      `/api/v1/mcp/oauth/authorize?${query.toString()}`,
      undefined,
      undefined,
      'manual',
    );
    const consentToken = String(authorization.body).match(
      /name="consent_token" value="([A-Za-z0-9_-]+)"/,
    )?.[1];
    expect(consentToken).toBeTruthy();

    const db = KyselyServer.getInstance().db;
    const original = await db
      .selectFrom('company_bee')
      .select('rank')
      .where('user_id', '=', companyId)
      .where('bee_id', '=', beeId)
      .executeTakeFirstOrThrow();
    try {
      await db
        .updateTable('company_bee')
        .set({ rank: ROLES.ghost })
        .where('user_id', '=', companyId)
        .where('bee_id', '=', beeId)
        .executeTakeFirst();
      const response = await agent.request(
        'POST',
        '/api/v1/mcp/oauth/authorize',
        { consent_token: consentToken, decision: 'approve' },
        undefined,
        'manual',
      );
      expect(response.statusCode).toBe(302);
      const callback = new URL(response.headers.location);
      expect(callback.searchParams.get('error')).toBe('access_denied');
      expect(callback.searchParams.get('state')).toBe('pending-consent-state');
    } finally {
      await db
        .updateTable('company_bee')
        .set({ rank: original.rank })
        .where('user_id', '=', companyId)
        .where('bee_id', '=', beeId)
        .executeTakeFirst();
    }
  });

  it('returns OAuth errors and cache headers for malformed token requests', async () => {
    const response = await jsonRequest('POST', '/api/v1/mcp/oauth/token', {
      grant_type: 'password',
    });
    expect(response.status).toBe(400);
    expect(objectBody(response).error).toBe('invalid_request');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('pragma')).toBe('no-cache');
  });

  it('challenges failed HTTP Basic client authentication', async () => {
    const response = await jsonRequest(
      'POST',
      '/api/v1/mcp/oauth/token',
      {
        grant_type: 'refresh_token',
        refresh_token: 'invalid-refresh-token',
        resource: mcpResource,
      },
      {
        Authorization: `Basic ${Buffer.from(`${clientId}:invalid-secret`).toString('base64')}`,
      },
    );
    expect(response.status).toBe(401);
    expect(objectBody(response).error).toBe('invalid_client');
    expect(response.headers.get('www-authenticate')).toBe(
      'Basic realm="b.tree MCP OAuth"',
    );
  });

  it('maps lost premium access to invalid_grant on refresh', async () => {
    const db = KyselyServer.getInstance().db;
    const original = await db
      .selectFrom('companies')
      .select('paid')
      .where('id', '=', companyId)
      .executeTakeFirstOrThrow();

    try {
      await db
        .updateTable('companies')
        .set({ paid: new Date('2000-01-01T00:00:00Z') })
        .where('id', '=', companyId)
        .executeTakeFirst();
      const response = await jsonRequest('POST', '/api/v1/mcp/oauth/token', {
        grant_type: 'refresh_token',
        client_id: clientId,
        refresh_token: refreshToken,
        resource: mcpResource,
      });
      expect(response.status).toBe(400);
      expect(objectBody(response).error).toBe('invalid_grant');
    } finally {
      await db
        .updateTable('companies')
        .set({ paid: original.paid })
        .where('id', '=', companyId)
        .executeTakeFirst();
    }
  });

  it('issues a resource-bound bare JWT', () => {
    expect(accessToken.split('.')).toHaveLength(3);
    const payload = JSON.parse(
      Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'),
    ) as Record<string, unknown>;
    expect(payload).toMatchObject({
      typ: 'mcp_access',
      client_id: clientId,
      aud: mcpResource,
      iss: `http://localhost:${process.env.PORT}`,
      scope: 'mcp',
    });
  });

  it('lists every currently exposed WizBee tool', async () => {
    const response = await jsonRequest(
      'POST',
      '/api/v1/mcp',
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: modernParams(),
      },
      {
        Authorization: `Bearer ${accessToken}`,
        'MCP-Protocol-Version': '2026-07-28',
        'Mcp-Method': 'tools/list',
      },
    );
    expect(response.status).toBe(200);
    const result = objectBody(response).result as Record<string, unknown>;
    const tools = result.tools as Array<Record<string, unknown>>;
    expect(
      tools
        .map((tool) => String(tool.name))
        .sort((left, right) => left.localeCompare(right)),
    ).toEqual(
      wizBeeToolDefinitions
        .map((tool) => tool.name)
        .sort((left, right) => left.localeCompare(right)),
    );
  });

  it('executes an existing tool through MCP', async () => {
    const response = await jsonRequest(
      'POST',
      '/api/v1/mcp',
      {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          ...modernParams(),
          name: 'calculateSugarWater',
          arguments: { ratio: '1:1', sugar: 1 },
        },
      },
      {
        Authorization: `Bearer ${accessToken}`,
        'MCP-Protocol-Version': '2026-07-28',
        'Mcp-Method': 'tools/call',
        'Mcp-Name': 'calculateSugarWater',
      },
    );
    expect(response.status).toBe(200);
    const result = objectBody(response).result as Record<string, unknown>;
    expect(result.structuredContent).toBeTypeOf('object');
    expect(result.isError).not.toBe(true);
  });

  it('supports the 2025-era initialize handshake from the same endpoint', async () => {
    const response = await jsonRequest(
      'POST',
      '/api/v1/mcp',
      {
        jsonrpc: '2.0',
        id: 4,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          capabilities: {},
          clientInfo: { name: 'legacy-e2e', version: '1.0.0' },
        },
      },
      { Authorization: `Bearer ${accessToken}` },
    );
    expect(response.status).toBe(200);
    const result = objectBody(response).result as Record<string, unknown>;
    expect(result.protocolVersion).toBe('2025-11-25');
  });

  it('keeps MCP refresh tokens out of the legacy OAuth flow', async () => {
    const leakedRefreshToken = 'mcp-resource-bound-refresh-token';
    const accessPayload = JSON.parse(
      Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'),
    ) as Record<string, number>;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    const tokenHash = createHash('sha256')
      .update(leakedRefreshToken)
      .digest('hex');
    const db = KyselyServer.getInstance().db;
    await db
      .insertInto('agent_oauth_refresh_tokens')
      .values({
        client_id: process.env.OAUTH_CLIENT_ID!,
        token_hash: tokenHash,
        token_family: 'mcp-isolation-test-family',
        bee_id: accessPayload.bee_id,
        user_id: accessPayload.user_id,
        scope: 'mcp',
        resource: mcpResource,
        expires_at: expiresAt,
      })
      .executeTakeFirstOrThrow();

    try {
      const response = await jsonRequest(
        'POST',
        '/api/v1/chatgpt/oauth/token',
        {
          grant_type: 'refresh_token',
          refresh_token: leakedRefreshToken,
          client_id: process.env.OAUTH_CLIENT_ID,
          client_secret: process.env.OAUTH_CLIENT_SECRET,
        },
      );
      expect(response.status).toBe(401);
    } finally {
      await db
        .deleteFrom('agent_oauth_refresh_tokens')
        .where('token_hash', '=', tokenHash)
        .execute();
    }
  });

  it('rotates refresh tokens and revokes the family on replay', async () => {
    const refreshed = await jsonRequest('POST', '/api/v1/mcp/oauth/token', {
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
      resource: mcpResource,
    });
    expect(refreshed.status).toBe(200);
    const nextRefreshToken = objectBody(refreshed).refresh_token as string;
    expect(nextRefreshToken).not.toBe(refreshToken);

    const replay = await jsonRequest('POST', '/api/v1/mcp/oauth/token', {
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
      resource: mcpResource,
    });
    expect(replay.status).toBe(400);
    expect(objectBody(replay).error).toBe('invalid_grant');

    const successor = await jsonRequest('POST', '/api/v1/mcp/oauth/token', {
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: nextRefreshToken,
      resource: mcpResource,
    });
    expect(successor.status).toBe(400);
    expect(objectBody(successor).error).toBe('invalid_grant');
  });

  it('revokes one MCP connection from profile settings', async () => {
    const tokenFamily = 'AAAAAAAAAAAAAAAAAAAAAA';
    const tokenHash = createHash('sha256')
      .update('profile-settings-refresh-token')
      .digest('hex');
    const accessPayload = JSON.parse(
      Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'),
    ) as Record<string, number>;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    const db = KyselyServer.getInstance().db;
    await db
      .insertInto('agent_oauth_refresh_tokens')
      .values({
        client_id: clientId,
        token_hash: tokenHash,
        token_family: tokenFamily,
        bee_id: accessPayload.bee_id,
        user_id: accessPayload.user_id,
        scope: 'mcp',
        resource: mcpResource,
        expires_at: expiresAt,
      })
      .executeTakeFirstOrThrow();

    const response = await agent.request(
      'DELETE',
      `/api/v1/mcp/connections/${tokenFamily}`,
      {},
    );
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ revoked: 1 });

    const stored = await db
      .selectFrom('agent_oauth_refresh_tokens')
      .select('revoked_at')
      .where('token_hash', '=', tokenHash)
      .executeTakeFirstOrThrow();
    expect(stored.revoked_at).not.toBeNull();
  });
});
