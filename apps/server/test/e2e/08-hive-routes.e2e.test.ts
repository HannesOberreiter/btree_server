import { beforeAll, describe, expect, it } from 'vitest';

import {
  deleteHives,
  getHiveDetail,
  getHivesByIds,
  listHives,
  updateHives,
  updateHiveStatus,
} from '../../src/api/modules/hive.module.js';
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
  name: 'Hive',
  apiary_id: 1,
  date: new Date().toISOString().slice(0, 10),
  source_id: 1,
  type_id: 1,
  start: 0,
  repeat: 10,
};

const patchName = `Hive${Date.now()}`;

describe('hive routes', () => {
  const route = '/api/v1/hive';
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
    expect(res2.body).toBeInstanceOf(Array);
    insertId = res2.body[0];
  });

  describe('/api/v1/hive/', () => {
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
        (hive: { id: number }) => hive.id === insertId,
      );
      expect(inserted).toEqual(
        expect.objectContaining({
          id: insertId,
          name: expect.any(String),
          modus: expect.any(Boolean),
          deleted: false,
          hive_location: expect.objectContaining({
            apiary_id: testInsert.apiary_id,
            movedate: expect.objectContaining({
              hive_id: insertId,
              apiary_id: testInsert.apiary_id,
            }),
          }),
        }),
      );
    });

    it('operations enforce company isolation', async () => {
      const db = KyselyServer.getInstance().db;
      expect(await listHives(db, 999_999, { deleted: false })).toEqual({
        results: [],
        total: 0,
      });
      expect(await getHivesByIds(db, 999_999, [insertId])).toEqual([]);
      expect(
        await updateHives(db, 999_999, 1, {
          ids: [insertId],
          data: { note: 'not allowed' },
        }),
      ).toBe(0);
      expect(await updateHiveStatus(db, 999_999, 1, [insertId], false)).toBe(0);
      expect(
        await deleteHives(db, 999_999, 1, [insertId], {
          hard: true,
          restore: false,
        }),
      ).toEqual([]);
      await expect(getHiveDetail(db, 999_999, insertId)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('get 200 - accepts numeric search text', async () => {
      const hive = await doRequest(agent, 'post', route, null, accessToken, {
        ...testInsert,
        name: '2603',
        repeat: 1,
      });
      expect(hive.statusCode).toBe(200);

      const res = await doQueryRequest(agent, route, null, accessToken, {
        q: 2603,
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.results).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: hive.body[0] })]),
      );
    });

    it('get 200 - orders by apiary name', async () => {
      const hiveIds: number[] = [];
      for (const apiaryName of ['AAA ordering apiary', 'ZZZ ordering apiary']) {
        const apiary = await doRequest(
          agent,
          'post',
          '/api/v1/apiary',
          null,
          accessToken,
          { name: apiaryName },
        );
        expect(apiary.statusCode).toBe(200);

        const hive = await doRequest(agent, 'post', route, null, accessToken, {
          ...testInsert,
          name: `${apiaryName} hive`,
          apiary_id: apiary.body.id,
          repeat: 1,
        });
        expect(hive.statusCode).toBe(200);
        hiveIds.push(hive.body[0]);
      }

      const res = await doQueryRequest(agent, route, null, accessToken, {
        order: 'apiary_name',
        direction: 'desc',
        details: true,
        limit: 500,
      });
      expect(res.statusCode).toBe(200);
      const orderedIds = res.body.results.map(
        (hive: { id: number }) => hive.id,
      );
      expect(orderedIds.indexOf(hiveIds[1])).toBeLessThan(
        orderedIds.indexOf(hiveIds[0]),
      );
    });

    it('get 200 - orders by queen name', async () => {
      const res = await doQueryRequest(agent, route, null, accessToken, {
        order: 'queen_location.queen_name',
        direction: 'asc',
        details: true,
      });
      expect(res.statusCode).toBe(200);
    });

    it('get 200 - includes detailed relations when requested', async () => {
      const res = await doQueryRequest(agent, route, null, accessToken, {
        details: true,
      });
      expect(res.statusCode).toBe(200);
      const inserted = res.body.results.find(
        (hive: { id: number }) => hive.id === insertId,
      );
      expect(inserted).toEqual(
        expect.objectContaining({
          hive_source: expect.objectContaining({ id: testInsert.source_id }),
          hive_type: expect.objectContaining({ id: testInsert.type_id }),
          creator: expect.objectContaining({ email: expect.any(String) }),
          queen_location: null,
        }),
      );
    });

    it('post 400 - no data', async () => {
      const res = await doRequest(
        agent,
        'post',
        route,
        null,
        accessToken,
        null,
      );
      expect(res.statusCode).toEqual(400);
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
        data: { name: patchName },
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(1);
    });

    it('patch 200 - success second patch with same name', async () => {
      const res = await doRequest(agent, 'patch', route, null, accessToken, {
        ids: [insertId],
        data: { name: patchName },
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(1);
    });
  });

  describe('/api/v1/hive/:id', () => {
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
      expect(res.body).toEqual(
        expect.objectContaining({
          id: insertId,
          name: expect.any(String),
          sameLocation: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(Number),
              name: expect.any(String),
              position: expect.any(Number),
            }),
          ]),
          firstMovedate: expect.objectContaining({
            hive_id: insertId,
            apiary_id: testInsert.apiary_id,
          }),
          hive_location: expect.objectContaining({
            apiary_id: testInsert.apiary_id,
          }),
          hive_source: expect.objectContaining({ id: testInsert.source_id }),
          hive_type: expect.objectContaining({ id: testInsert.type_id }),
        }),
      );
    });
  });

  describe('/api/v1/hive/task/:id', () => {
    it('401 - no header', async () => {
      const res = await doQueryRequest(
        createAgent(),
        `${route}/task`,
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
        `${route}/task`,
        insertId,
        accessToken,
        null,
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('harvest');
      expect(res.body).toHaveProperty('feed');
      expect(res.body).toHaveProperty('treatment');
      expect(res.body).toHaveProperty('checkup');
      expect(res.body).toHaveProperty('movedate');
    });
  });

  describe('/api/v1/hive/batchGet', () => {
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

  describe('/api/v1/hive/updatePosition', () => {
    it('401 - no header', async () => {
      const res = await doRequest(
        createAgent(),
        'patch',
        `${route}/updatePosition`,
        null,
        null,
        { data: [{ position: 0, id: insertId }] },
      );
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('400 - missing ids', async () => {
      const res = await doRequest(
        agent,
        'patch',
        `${route}/updatePosition`,
        null,
        null,
        null,
      );
      expect(res.statusCode).toEqual(400);
      expectations(res, 'data', 'Invalid value');
    });
    it('200 - success', async () => {
      const res = await doRequest(
        agent,
        'patch',
        `${route}/updatePosition`,
        null,
        accessToken,
        { data: [{ position: 0, id: insertId }] },
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body[0]).toBe(1);
    });
  });

  describe('/api/v1/hive/batchDelete', () => {
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

  describe('/api/v1/hive/status', () => {
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
});
