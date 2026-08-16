import { beforeAll, describe, expect, it } from 'vitest';

import {
  getApiariesByIds,
  getApiaryDetail,
  listApiaries,
  updateApiaryStatus,
} from '../../src/api/modules/apiary.module.js';
import { KyselyServer } from '../../src/servers/kysely.server.js';
import type { TestAgent } from '../utils.js';
import {
  createAgent,
  createAuthenticatedAgent,
  doQueryRequest,
  doRequest,
  expectations,
} from '../utils.js';

const testInsert = {
  name: `TestApiary${new Date().toISOString()}`,
};

describe('apiary routes', () => {
  const route = '/api/v1/apiary';
  let agent: TestAgent;
  let accessToken: any;
  let insertId: any;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
    const res2 = await doRequest(
      agent,
      'post',
      route,
      null,
      accessToken,
      testInsert,
    );
    expect(res2.statusCode).toEqual(200);
    expect(res2.body).toHaveProperty('id');
    insertId = res2.body.id;
  });

  describe('/api/v1/apiary/', () => {
    it('get 401 - no header', async () => {
      const res = await doQueryRequest(createAgent(), route, null, null, null);
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('post 401 - no header', async () => {
      const res = await doRequest(
        createAgent(),
        'post',
        route,
        null,
        null,
        testInsert,
      );
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('patch 401 - no header', async () => {
      const res = await doRequest(createAgent(), 'patch', route, null, null, {
        ids: [insertId],
        data: {},
      });
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });

    it('get 200 - success', async () => {
      const res = await doQueryRequest(agent, route, null, accessToken, null);
      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toBeInstanceOf(Array);
      expect(res.body.total).toBeTypeOf('number');
      const inserted = res.body.results.find(
        (apiary: { id: number }) => apiary.id === insertId,
      );
      expect(inserted).toEqual(
        expect.objectContaining({
          id: insertId,
          name: testInsert.name,
          latitude: expect.any(Number),
          longitude: expect.any(Number),
          hive_count: null,
        }),
      );
    });

    it.each(['created_at', 'updated_at', 'deleted_at'])(
      'get 200 - orders by %s',
      async (order) => {
        const res = await doQueryRequest(agent, route, null, accessToken, {
          order,
          direction: 'desc',
        });
        expect(res.statusCode).toBe(200);
      },
    );

    it('operations enforce company isolation', async () => {
      const db = KyselyServer.getInstance().db;
      expect(await listApiaries(db, 999_999, { deleted: false })).toEqual({
        results: [],
        total: 0,
      });
      expect(await getApiariesByIds(db, 999_999, [insertId])).toEqual([]);
      expect(await updateApiaryStatus(db, 999_999, 1, [insertId], false)).toBe(
        0,
      );
      await expect(
        getApiaryDetail(db, 999_999, insertId),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('get 200 - includes detailed relations when requested', async () => {
      const res = await doQueryRequest(agent, route, null, accessToken, {
        details: true,
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.results).toBeInstanceOf(Array);
      const inserted = res.body.results.find(
        (apiary: { id: number }) => apiary.id === insertId,
      );
      expect(inserted).toHaveProperty('creator');
      expect(inserted).toHaveProperty('editor');
      const withHives = res.body.results.find(
        (apiary: { hive_count: unknown }) => apiary.hive_count,
      );
      if (withHives) {
        expect(withHives.hive_count).toEqual(
          expect.objectContaining({
            id: expect.any(Number),
            count: expect.any(Number),
            grouphivescount: expect.any(Number),
          }),
        );
      }
    });

    it('get 200 - bare nullable modus query', async () => {
      const res = await agent.request('get', `${route}?modus`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toBeInstanceOf(Array);
    });

    it('post 400 - no name', async () => {
      const res = await doRequest(
        agent,
        'post',
        route,
        null,
        accessToken,
        null,
      );
      expect(res.statusCode).toEqual(400);
      expectations(res, 'name', 'Invalid value');
    });

    it('post 409 - duplicate name', async () => {
      const res = await doRequest(
        agent,
        'post',
        route,
        null,
        accessToken,
        testInsert,
      );
      expect(res.statusCode).toEqual(409);
    });

    it('patch 200 - success', async () => {
      const res = await doRequest(agent, 'patch', route, null, accessToken, {
        ids: [insertId],
        data: { name: 'test2', latitude: '1.25', longitude: '2.5' },
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(1);
    });
  });

  describe('/api/v1/apiary/:id', () => {
    it('401 - no header', async () => {
      const res = await doQueryRequest(
        createAgent(),
        route,
        insertId,
        null,
        null,
      );
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('200 - success', async () => {
      const res = await doQueryRequest(
        agent,
        route,
        insertId,
        accessToken,
        null,
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('sameLocation');
      expect(res.body).toMatchObject({
        id: insertId,
        latitude: 1.25,
        longitude: 2.5,
        hives: [],
        hive_count: null,
      });
      expect(res.body.sameLocation).toBeInstanceOf(Array);
    });
  });

  describe('/api/v1/apiary/batchGet', () => {
    it('401 - no header', async () => {
      const res = await doRequest(
        createAgent(),
        'post',
        `${route}/batchGet`,
        null,
        null,
        { ids: [insertId] },
      );
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('400 - missing ids', async () => {
      const res = await doRequest(
        agent,
        'post',
        `${route}/batchGet`,
        null,
        null,
        null,
      );
      expect(res.statusCode).toEqual(400);
      expectations(res, 'ids', 'Invalid value');
    });
    it('200 - success', async () => {
      const res = await doRequest(
        agent,
        'post',
        `${route}/batchGet`,
        null,
        accessToken,
        { ids: [insertId] },
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
    });
  });

  describe('/api/v1/apiary/batchDelete', () => {
    it('401 - no header', async () => {
      const res = await doRequest(
        createAgent(),
        'patch',
        `${route}/batchDelete`,
        null,
        null,
        { ids: [] },
      );
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('400 - missing ids', async () => {
      const res = await doRequest(
        agent,
        'patch',
        `${route}/batchDelete`,
        null,
        null,
        null,
      );
      expect(res.statusCode).toEqual(400);
      expectations(res, 'ids', 'Invalid value');
    });
    it('200 - success', async () => {
      const res = await doRequest(
        agent,
        'patch',
        `${route}/batchDelete`,
        null,
        accessToken,
        { ids: [insertId] },
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
    });
  });

  describe('/api/v1/apiary/status', () => {
    it('401 - no header', async () => {
      const res = await doRequest(
        createAgent(),
        'patch',
        `${route}/status`,
        null,
        null,
        { ids: [], status: true },
      );
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('400 - missing ids', async () => {
      const res = await doRequest(
        agent,
        'patch',
        `${route}/status`,
        null,
        null,
        null,
      );
      expect(res.statusCode).toEqual(400);
      expectations(res, 'ids', 'Invalid value');
    });
    it('200 - success', async () => {
      const res = await doRequest(
        agent,
        'patch',
        `${route}/status`,
        null,
        accessToken,
        { ids: [insertId], status: false },
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(1);
    });
  });

  describe('/api/v1/apiary/batchDelete restore and hard delete', () => {
    it('restores then hard-deletes an empty apiary', async () => {
      const restored = await doRequest(
        agent,
        'patch',
        `${route}/batchDelete?restore=true`,
        null,
        accessToken,
        { ids: [insertId] },
      );
      expect(restored.statusCode).toBe(200);
      expect(restored.body).toHaveLength(1);

      const hardDeleted = await doRequest(
        agent,
        'patch',
        `${route}/batchDelete?hard=true`,
        null,
        accessToken,
        { ids: [insertId] },
      );
      expect(hardDeleted.statusCode).toBe(200);
      expect(hardDeleted.body).toHaveLength(1);

      const remaining = await doRequest(
        agent,
        'post',
        `${route}/batchGet`,
        null,
        accessToken,
        { ids: [insertId] },
      );
      expect(remaining.body).toEqual([]);
    });
  });
});
