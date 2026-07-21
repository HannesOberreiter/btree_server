import { beforeAll, describe, expect, it } from 'vitest';

import {
  getMovedatesByIds,
  listMovedates,
  updateMovedateDates,
} from '../../src/api/modules/movedate.module.js';
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
  hive_ids: [2, 3],
  apiary_id: 1,
  date: new Date().toISOString().slice(0, 10),
};

describe('movedate routes', () => {
  const route = '/api/v1/movedate';
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

  describe('/api/v1/movedate/', () => {
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
      const res = await doQueryRequest(agent, route, null, accessToken, {
        limit: 1000,
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toBeInstanceOf(Array);
      expect(res.body.total).toBeTypeOf('number');
      const inserted = res.body.results.find(
        (movedate: { id: number }) => movedate.id === insertId,
      );
      expect(inserted).toEqual(
        expect.objectContaining({
          id: insertId,
          hive: expect.objectContaining({ id: testInsert.hive_ids[0] }),
          apiary: expect.objectContaining({ id: testInsert.apiary_id }),
          creator: expect.objectContaining({ email: expect.any(String) }),
        }),
      );
    });

    it('operations enforce company isolation', async () => {
      const db = KyselyServer.getInstance().db;
      expect(await listMovedates(db, 999_999, {})).toEqual({
        results: [],
        total: 0,
      });
      expect(await getMovedatesByIds(db, 999_999, [insertId])).toEqual([]);
      expect(
        await updateMovedateDates(db, 999_999, 1, [insertId], testInsert.date),
      ).toBe(0);
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

    it('patch 200 - success', async () => {
      const res = await doRequest(agent, 'patch', route, null, accessToken, {
        ids: [insertId],
        data: {},
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(1);
    });
  });

  describe('/api/v1/movedate/batchGet', () => {
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

  describe('/api/v1/movedate/date', () => {
    it('401 - no header', async () => {
      const res = await doRequest(
        createAgent(),
        'patch',
        `${route}/date`,
        null,
        null,
        { ids: [], start: testInsert.date },
      );
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('400 - missing ids', async () => {
      const res = await doRequest(
        agent,
        'patch',
        `${route}/date`,
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
        `${route}/date`,
        null,
        accessToken,
        { ids: [insertId], start: testInsert.date },
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(1);
    });
  });

  describe('/api/v1/movedate/batchDelete', () => {
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
      expect(res.body).toBe(1);
    });
  });
});
