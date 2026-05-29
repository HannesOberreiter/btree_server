import process from 'node:process';

import { beforeAll, describe, expect, it } from 'vitest';

import type { TestAgent } from '../utils.js';
import { createAgent, demoUser, doRequest } from '../utils.js';

/**
 * Helper for raw fetch with Bearer token (TestAgent uses cookie auth)
 */
async function agentFetch(
  method: string,
  path: string,
  apiKey: string,
  body?: unknown,
) {
  const baseUrl = `http://localhost:${process.env.PORT}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Origin: process.env.ORIGIN!,
      Authorization: `Bearer ${apiKey}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const contentType = res.headers.get('content-type') ?? '';
  const responseBody = contentType.includes('json')
    ? await res.json()
    : await res.text();
  return { statusCode: res.status, body: responseBody };
}

/**
 * Helper for raw fetch WITHOUT auth
 */
async function noAuthFetch(method: string, path: string, body?: unknown) {
  const baseUrl = `http://localhost:${process.env.PORT}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Origin: process.env.ORIGIN!,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const contentType = res.headers.get('content-type') ?? '';
  const responseBody = contentType.includes('json')
    ? await res.json()
    : await res.text();
  return { statusCode: res.status, body: responseBody };
}

async function noAuthFetchNoRedirect(method: string, path: string) {
  const baseUrl = `http://localhost:${process.env.PORT}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      Origin: process.env.ORIGIN!,
    },
    redirect: 'manual',
  });
  const contentType = res.headers.get('content-type') ?? '';
  const responseBody = contentType.includes('json')
    ? await res.json()
    : await res.text();
  return {
    statusCode: res.status,
    body: responseBody,
    location: res.headers.get('location'),
  };
}

describe('agent key & agent API routes', () => {
  let agent: TestAgent;
  let createdKeyId: number;
  let plaintextKey: string;

  beforeAll(async () => {
    agent = createAgent();
    // Login as demo user
    const loginRes = await doRequest(
      agent,
      'post',
      '/api/v1/auth/login',
      null,
      null,
      demoUser,
    );
    expect(loginRes.statusCode).toEqual(200);
  });

  // ─── Agent Key CRUD ────────────────────────────────────────────

  describe('pOST /api/v1/agent_key', () => {
    it('201 - create agent key', async () => {
      const res = await doRequest(
        agent,
        'post',
        '/api/v1/agent_key',
        null,
        null,
        {
          label: 'E2E Test Key',
        },
      );
      expect(res.statusCode).toEqual(201);
      expect(res.body.key).toBeDefined();
      expect(res.body.key).toMatch(/^btree_ak_/);
      expect(res.body.id).toBeTypeOf('number');
      expect(res.body.label).toEqual('E2E Test Key');
      expect(res.body.message).toContain('not be shown again');

      createdKeyId = res.body.id;
      plaintextKey = res.body.key;
    });

    it('201 - create key with expiry', async () => {
      const futureDate = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const res = await doRequest(
        agent,
        'post',
        '/api/v1/agent_key',
        null,
        null,
        {
          label: 'Expiring Key',
          valid_to: futureDate,
        },
      );
      expect(res.statusCode).toEqual(201);
      expect(res.body.valid_to).toBeDefined();
    });

    it('201 - create key without label', async () => {
      const res = await doRequest(
        agent,
        'post',
        '/api/v1/agent_key',
        null,
        null,
        {},
      );
      expect(res.statusCode).toEqual(201);
      expect(res.body.label).toBeNull();
    });
  });

  describe('gET /api/v1/agent_key', () => {
    it('200 - list keys (never exposes hash)', async () => {
      const res = await doRequest(
        agent,
        'get',
        '/api/v1/agent_key',
        null,
        null,
        null,
      );
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const key = res.body.find((k: any) => k.id === createdKeyId);
      expect(key).toBeDefined();
      expect(key.key_prefix).toMatch(/^btree_ak_/);
      expect(key.label).toEqual('E2E Test Key');
      // Must not expose sensitive fields
      expect(key.key_hash).toBeUndefined();
      expect(key.salt).toBeUndefined();
    });
  });

  // ─── Agent API Endpoint ────────────────────────────────────────

  describe('gET /api/v1/agent/openapi.json', () => {
    it('200 - without auth', async () => {
      const res = await noAuthFetch('GET', '/api/v1/agent/openapi.json');
      expect(res.statusCode).toEqual(200);
      expect(res.body.openapi).toBeDefined();
    });

    it('200 - with valid key', async () => {
      const res = await agentFetch(
        'GET',
        '/api/v1/agent/openapi.json',
        plaintextKey,
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body.openapi).toBeDefined();
      expect(res.body.info.title).toContain('b.tree');
      expect(res.body.paths).toBeDefined();
    });
  });

  describe('agent OAuth endpoints', () => {
    const authorizeQuery = new URLSearchParams({
      response_type: 'code',
      client_id: 'test-chatgpt-client',
      redirect_uri: 'https://chatgpt.com/aip/g-test/oauth/callback',
      scope: 'agent',
      state: 'state-123',
    });

    it('400 - authorize requires state', async () => {
      const params = new URLSearchParams(authorizeQuery);
      params.delete('state');
      const res = await noAuthFetch(
        'GET',
        `/api/v1/agent/oauth/authorize?${params.toString()}`,
      );
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Missing state');
    });

    it('302 - authorize redirects anonymous user to login', async () => {
      const res = await noAuthFetchNoRedirect(
        'GET',
        `/api/v1/agent/oauth/authorize?${authorizeQuery.toString()}`,
      );
      expect(res.statusCode).toEqual(302);
      expect(res.location).toContain('http://localhost:9000/visitor/login');
      expect(res.location).toContain('oauth=1');
      expect(res.location).toContain('server=eu');
      expect(res.location).toContain(encodeURIComponent('state=state-123'));
    });

    it('400 - token rejects unsupported grant_type', async () => {
      const res = await noAuthFetch('POST', '/api/v1/agent/oauth/token', {
        grant_type: 'password',
        client_id: 'test-chatgpt-client',
        client_secret: 'test-chatgpt-secret',
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Unsupported grant_type');
    });

    it('401 - token rejects invalid client secret', async () => {
      const res = await noAuthFetch('POST', '/api/v1/agent/oauth/token', {
        grant_type: 'authorization_code',
        client_id: 'test-chatgpt-client',
        client_secret: 'wrong-secret',
        code: 'invalid-code',
        redirect_uri: 'https://chatgpt.com/aip/g-test/oauth/callback',
      });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Invalid OAuth client');
    });

    it('401 - random bearer keeps API key format error', async () => {
      const res = await agentFetch(
        'POST',
        '/api/v1/agent/tools/listApiariesHives',
        'abc.def.ghi',
        {},
      );
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual(
        'Invalid API key format. Expected key starting with btree_ak_',
      );
    });
  });

  describe('pOST /api/v1/agent/tools/listApiariesHives', () => {
    it('401 - without auth', async () => {
      const res = await noAuthFetch(
        'POST',
        '/api/v1/agent/tools/listApiariesHives',
        {},
      );
      expect(res.statusCode).toEqual(401);
    });

    it('200 - with valid key', async () => {
      const res = await agentFetch(
        'POST',
        '/api/v1/agent/tools/listApiariesHives',
        plaintextKey,
        { includeInactive: false },
      );
      expect(res.statusCode).toEqual(200);
      // Should return apiaries array (may be empty for test user)
      expect(res.body).toBeDefined();
    });

    it('401 - with invalid key', async () => {
      const res = await agentFetch(
        'POST',
        '/api/v1/agent/tools/listApiariesHives',
        'btree_ak_invalidkeyhere1234567890',
        {},
      );
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('expired key handling', () => {
    let expiredKey: string;

    it('create an already-expired key', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const res = await doRequest(
        agent,
        'post',
        '/api/v1/agent_key',
        null,
        null,
        {
          label: 'Expired Key',
          valid_to: pastDate,
        },
      );
      expect(res.statusCode).toEqual(201);
      expiredKey = res.body.key;
    });

    it('401 - expired key is rejected', async () => {
      const res = await agentFetch(
        'POST',
        '/api/v1/agent/tools/listApiariesHives',
        expiredKey,
        {},
      );
      expect(res.statusCode).toEqual(401);
    });
  });

  // ─── Delete Key ────────────────────────────────────────────────

  describe('dELETE /api/v1/agent_key/:id', () => {
    it('200 - delete key', async () => {
      const res = await doRequest(
        agent,
        'delete',
        '/api/v1/agent_key',
        createdKeyId,
        null,
        {},
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toContain('deleted');
    });

    it('401 - deleted key no longer works', async () => {
      const res = await agentFetch(
        'POST',
        '/api/v1/agent/tools/listApiariesHives',
        plaintextKey,
        {},
      );
      expect(res.statusCode).toEqual(401);
    });

    it('404 - delete non-existent key', async () => {
      const res = await doRequest(
        agent,
        'delete',
        '/api/v1/agent_key',
        999999,
        null,
        {},
      );
      expect(res.statusCode).toEqual(404);
    });
  });
});
