import process from 'node:process';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ROLES } from '../../src/config/constants.config.js';
import { KyselyServer } from '../../src/servers/kysely.server.js';
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
  const db = KyselyServer.getInstance().db;
  let agent: TestAgent;
  let createdKeyId: number;
  let plaintextKey: string;
  let companyId: number;
  let beeId: number;
  let originalRank: number;
  let originalPaid: Date | null;

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

    const membership = await db
      .selectFrom('company_bee')
      .innerJoin('bees', 'bees.id', 'company_bee.bee_id')
      .innerJoin('companies', 'companies.id', 'company_bee.user_id')
      .select([
        'company_bee.user_id as companyId',
        'company_bee.bee_id as beeId',
        'company_bee.rank',
        'companies.paid',
      ])
      .where('bees.email', '=', demoUser.email)
      .executeTakeFirstOrThrow();
    companyId = membership.companyId;
    beeId = membership.beeId;
    originalRank = membership.rank ?? ROLES.admin;
    originalPaid = membership.paid;
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
    const redirectUri = 'https://chatgpt.com/aip/g-test/oauth/callback';
    const authorizeQuery = new URLSearchParams({
      response_type: 'code',
      client_id: 'test-chatgpt-client',
      redirect_uri: redirectUri,
      scope: 'agent',
      state: 'state-123',
    });

    async function getAuthorizationCode() {
      const authorization = await agent.request(
        'GET',
        `/api/v1/chatgpt/oauth/authorize?${authorizeQuery.toString()}`,
        undefined,
        undefined,
        'manual',
      );
      expect(authorization.statusCode).toEqual(302);
      const location = authorization.headers.location;
      expect(location).toBeDefined();
      const code = new URL(location).searchParams.get('code');
      expect(code).toBeTruthy();
      return code!;
    }

    async function exchangeCode(code: string) {
      const token = await noAuthFetch('POST', '/api/v1/chatgpt/oauth/token', {
        grant_type: 'authorization_code',
        client_id: 'test-chatgpt-client',
        client_secret: 'test-chatgpt-secret',
        code,
        redirect_uri: redirectUri,
      });
      expect(token.statusCode).toEqual(200);
      expect(token.body.access_token).toMatch(/^btree_oauth_/);
      return token.body.access_token as string;
    }

    it('400 - authorize requires state', async () => {
      const params = new URLSearchParams(authorizeQuery);
      params.delete('state');
      const res = await noAuthFetch(
        'GET',
        `/api/v1/chatgpt/oauth/authorize?${params.toString()}`,
      );
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Missing state');
    });

    it('302 - authorize redirects anonymous user to login', async () => {
      const res = await noAuthFetchNoRedirect(
        'GET',
        `/api/v1/chatgpt/oauth/authorize?${authorizeQuery.toString()}`,
      );
      expect(res.statusCode).toEqual(302);
      expect(res.location).toContain('http://localhost:9000/visitor/login');
      expect(res.location).toContain('oauth=1');
      expect(res.location).toContain('server=eu');
      expect(res.location).toContain(encodeURIComponent('state=state-123'));
    });

    it('403 - authorize rejects read-only members', async () => {
      try {
        await db
          .updateTable('company_bee')
          .set({ rank: ROLES.read })
          .where('user_id', '=', companyId)
          .where('bee_id', '=', beeId)
          .executeTakeFirst();

        const res = await agent.request(
          'GET',
          `/api/v1/chatgpt/oauth/authorize?${authorizeQuery.toString()}`,
        );
        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toContain('write permission');
      } finally {
        await db
          .updateTable('company_bee')
          .set({ rank: originalRank })
          .where('user_id', '=', companyId)
          .where('bee_id', '=', beeId)
          .executeTakeFirst();
      }
    });

    it('403 - authorize rejects companies without premium', async () => {
      try {
        await db
          .updateTable('companies')
          .set({ paid: new Date('2000-01-01T00:00:00Z') })
          .where('id', '=', companyId)
          .executeTakeFirst();

        const res = await agent.request(
          'GET',
          `/api/v1/chatgpt/oauth/authorize?${authorizeQuery.toString()}`,
        );
        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toContain('premium subscription');
      } finally {
        await db
          .updateTable('companies')
          .set({ paid: originalPaid })
          .where('id', '=', companyId)
          .executeTakeFirst();
      }
    });

    it('403 - existing token follows current member role', async () => {
      const accessToken = await exchangeCode(await getAuthorizationCode());
      try {
        await db
          .updateTable('company_bee')
          .set({ rank: ROLES.read })
          .where('user_id', '=', companyId)
          .where('bee_id', '=', beeId)
          .executeTakeFirst();

        const res = await agentFetch(
          'POST',
          '/api/v1/chatgpt/tools/listApiariesHives',
          accessToken,
          {},
        );
        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toContain('write permission');
      } finally {
        await db
          .updateTable('company_bee')
          .set({ rank: originalRank })
          .where('user_id', '=', companyId)
          .where('bee_id', '=', beeId)
          .executeTakeFirst();
      }
    });

    it('403 - existing token follows current premium status', async () => {
      const accessToken = await exchangeCode(await getAuthorizationCode());
      try {
        await db
          .updateTable('companies')
          .set({ paid: new Date('2000-01-01T00:00:00Z') })
          .where('id', '=', companyId)
          .executeTakeFirst();

        const res = await agentFetch(
          'POST',
          '/api/v1/chatgpt/tools/listApiariesHives',
          accessToken,
          {},
        );
        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toContain('premium subscription');
      } finally {
        await db
          .updateTable('companies')
          .set({ paid: originalPaid })
          .where('id', '=', companyId)
          .executeTakeFirst();
      }
    });

    it('400 - token rejects unsupported grant_type', async () => {
      const res = await noAuthFetch('POST', '/api/v1/chatgpt/oauth/token', {
        grant_type: 'password',
        client_id: 'test-chatgpt-client',
        client_secret: 'test-chatgpt-secret',
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Unsupported grant_type');
    });

    it('401 - token rejects invalid client secret', async () => {
      const res = await noAuthFetch('POST', '/api/v1/chatgpt/oauth/token', {
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

    it('404 - tool errors preserve recovery details', async () => {
      const res = await agentFetch(
        'POST',
        '/api/v1/agent/tools/getHiveDetail',
        plaintextKey,
        { hiveId: 999_999_999 },
      );
      expect(res.statusCode).toEqual(404);
      expect(res.body).toMatchObject({
        statusCode: 404,
        code: 'not_found',
        details: {
          hint: expect.any(String),
          suggested_next_tool: 'findHives',
        },
      });
      expect(res.body).not.toHaveProperty('cause');
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

  describe('pOST /api/v1/agent/tools/listQueens', () => {
    let otherCompanyId: number;
    let apiaryId: number;
    let otherApiaryId: number;
    const hiveIds: number[] = [];
    const movedateIds: number[] = [];
    const queenIds: Record<string, number> = {};

    async function insertHive(name: string, userId: number, apiary: number) {
      const hive = await db
        .insertInto('hives')
        .values({ name, user_id: userId, modus: true })
        .executeTakeFirstOrThrow();
      const hiveId = Number(hive.insertId);
      hiveIds.push(hiveId);
      const movedate = await db
        .insertInto('movedates')
        .values({
          apiary_id: apiary,
          hive_id: hiveId,
          date: new Date('2024-01-01'),
        })
        .executeTakeFirstOrThrow();
      movedateIds.push(Number(movedate.insertId));
      return hiveId;
    }

    async function insertQueen(
      key: string,
      values: {
        userId: number;
        hiveId: number | null;
        date: string;
        modus?: boolean;
        moveDate?: string;
      },
    ) {
      const queen = await db
        .insertInto('queens')
        .values({
          name: `E2E queen ${key}`,
          user_id: values.userId,
          hive_id: values.hiveId,
          date: new Date(values.date),
          move_date: new Date(values.moveDate ?? values.date),
          modus: values.modus ?? true,
          modus_date: values.modus === false ? new Date('2025-03-01') : null,
          mark_colour: '#0000ff',
        })
        .executeTakeFirstOrThrow();
      queenIds[key] = Number(queen.insertId);
    }

    beforeAll(async () => {
      const otherCompany = await db
        .insertInto('companies')
        .values({ name: `Queen other ${Date.now()}` })
        .executeTakeFirstOrThrow();
      otherCompanyId = Number(otherCompany.insertId);

      const apiary = await db
        .insertInto('apiaries')
        .values({
          name: 'E2E queen apiary',
          latitude: 0,
          longitude: 0,
          user_id: companyId,
        })
        .executeTakeFirstOrThrow();
      apiaryId = Number(apiary.insertId);
      const otherApiary = await db
        .insertInto('apiaries')
        .values({
          name: 'E2E other queen apiary',
          latitude: 0,
          longitude: 0,
          user_id: otherCompanyId,
        })
        .executeTakeFirstOrThrow();
      otherApiaryId = Number(otherApiary.insertId);

      const inRange = await insertHive('E2E queen 1', companyId, apiaryId);
      const outOfRange = await insertHive('E2E queen 2', companyId, apiaryId);
      const inactive = await insertHive('E2E queen 3', companyId, apiaryId);
      const replaced = await insertHive('E2E queen 4', companyId, apiaryId);
      const other = await insertHive(
        'E2E queen 5',
        otherCompanyId,
        otherApiaryId,
      );

      await insertQueen('inRange', {
        userId: companyId,
        hiveId: inRange,
        date: '2024-12-31',
      });
      await insertQueen('outOfRange', {
        userId: companyId,
        hiveId: outOfRange,
        date: '2023-06-01',
      });
      await insertQueen('inactive', {
        userId: companyId,
        hiveId: inactive,
        date: '2024-06-01',
        modus: false,
      });
      await insertQueen('noHive', {
        userId: companyId,
        hiveId: null,
        date: '2024-03-01',
      });
      await insertQueen('replaced', {
        userId: companyId,
        hiveId: replaced,
        date: '2024-04-01',
      });
      await insertQueen('successor', {
        userId: companyId,
        hiveId: replaced,
        date: '2025-04-01',
        moveDate: '2025-05-01',
      });
      await insertQueen('otherCompany', {
        userId: otherCompanyId,
        hiveId: other,
        date: '2024-05-01',
      });
    });

    afterAll(async () => {
      await db
        .deleteFrom('queens')
        .where('id', 'in', Object.values(queenIds))
        .execute();
      await db.deleteFrom('movedates').where('id', 'in', movedateIds).execute();
      await db.deleteFrom('hives').where('id', 'in', hiveIds).execute();
      await db
        .deleteFrom('apiaries')
        .where('id', 'in', [apiaryId, otherApiaryId])
        .execute();
      await db
        .deleteFrom('companies')
        .where('id', '=', otherCompanyId)
        .execute();
    });

    async function callListQueens(body: Record<string, unknown>) {
      const res = await agentFetch(
        'POST',
        '/api/v1/agent/tools/listQueens',
        plaintextKey,
        body,
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body.truncated).toBe(false);
      expect(res.body.total).toEqual(res.body.queens.length);
      return {
        queens: res.body.queens,
        ids: res.body.queens.map((q: any) => q.queenId) as number[],
      };
    }

    function seededIds(ids: number[]) {
      const seeded = new Set(Object.values(queenIds));
      return ids.filter((id) => seeded.has(id));
    }

    function expectedIds(...keys: string[]) {
      return keys.map((key) => queenIds[key]).sort((a, b) => a - b);
    }

    it('200 - lists current queens within the birth date range', async () => {
      const { queens, ids } = await callListQueens({
        bornFrom: '2024-01-01',
        bornTo: '2024-12-31',
      });
      expect(seededIds(ids).sort((a, b) => a - b)).toEqual(
        expectedIds('inRange', 'inactive'),
      );
      for (const queen of queens) {
        expect(queen.date >= '2024-01-01' && queen.date <= '2024-12-31').toBe(
          true,
        );
      }
      expect(queens.find((q: any) => q.queenId === queenIds.inRange)).toEqual({
        queenId: queenIds.inRange,
        name: 'E2E queen inRange',
        date: '2024-12-31',
        markColour: '#0000ff',
        race: null,
        mating: null,
        active: true,
        inactiveDate: null,
        hiveId: hiveIds[0],
        hiveName: 'E2E queen 1',
        apiaryId,
        apiaryName: 'E2E queen apiary',
      });
      expect(
        queens.find((q: any) => q.queenId === queenIds.inactive),
      ).toMatchObject({
        active: false,
        inactiveDate: expect.stringContaining('2025-03-01'),
      });
    });

    it('200 - filters by apiaryId', async () => {
      const { ids } = await callListQueens({ apiaryId });
      expect(ids.sort((a, b) => a - b)).toEqual(
        expectedIds('inRange', 'outOfRange', 'inactive', 'successor'),
      );
    });

    it('200 - notInHive lists replaced queens and queens without a hive', async () => {
      const { ids } = await callListQueens({
        location: 'notInHive',
        bornFrom: '2024-01-01',
        bornTo: '2024-12-31',
      });
      expect(seededIds(ids).sort((a, b) => a - b)).toEqual(
        expectedIds('noHive', 'replaced'),
      );
    });

    it('200 - noHive lists only queens without a hive', async () => {
      const { ids } = await callListQueens({
        location: 'noHive',
        bornFrom: '2024-01-01',
        bornTo: '2024-12-31',
      });
      expect(seededIds(ids)).toEqual(expectedIds('noHive'));
    });

    it('200 - filters by hiveId and q', async () => {
      const byHive = await callListQueens({
        location: 'all',
        hiveId: hiveIds[3],
      });
      expect(byHive.ids.sort((a, b) => a - b)).toEqual(
        expectedIds('replaced', 'successor'),
      );

      const bySearch = await callListQueens({
        location: 'all',
        q: 'E2E queen inRange',
      });
      expect(bySearch.ids).toEqual(expectedIds('inRange'));
    });

    it('404 - rejects a hive of another company', async () => {
      const res = await agentFetch(
        'POST',
        '/api/v1/agent/tools/listQueens',
        plaintextKey,
        { hiveId: hiveIds[4] },
      );
      expect(res.statusCode).toEqual(404);
    });

    it('400 - rejects a malformed birth date', async () => {
      const res = await agentFetch(
        'POST',
        '/api/v1/agent/tools/listQueens',
        plaintextKey,
        { bornFrom: '2024' },
      );
      expect(res.statusCode).toEqual(400);
    });

    it('lists the tool in the agent OpenAPI spec', async () => {
      const res = await noAuthFetch('GET', '/api/v1/agent/openapi.json');
      expect(res.statusCode).toEqual(200);
      expect(
        Object.keys(res.body.paths).some((path) =>
          path.endsWith('/tools/listQueens'),
        ),
      ).toBe(true);
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
