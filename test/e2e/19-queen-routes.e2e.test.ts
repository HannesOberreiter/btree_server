import { beforeAll, describe, expect, it } from 'vitest';

import {
  getQueensByIds,
  updateQueenStatus,
} from '../../src/api/modules/queen.module.js';
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
  name: 'testQueen',
  hive_id: 1,
  date: new Date().toISOString().slice(0, 10),
  race_id: 1,
  mating_id: 1,
  start: 0,
  repeat: 10,
};

describe('queen routes', () => {
  const route = '/api/v1/queen';
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

  describe('/api/v1/queen/', () => {
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
    });

    it('get 200 - accepts numeric search text', async () => {
      const res = await doQueryRequest(agent, route, null, accessToken, {
        q: 2603,
      });
      expect(res.statusCode).toBe(200);
    });

    it('applies all queen table filters', async () => {
      for (const filter of [
        { 'queens.mating_id': 999_999 },
        { 'queens.race_id': 999_999 },
        { 'queens.hive_id': '999999' },
        { 'hive_location.apiary_id': 999_999 },
      ]) {
        const res = await doQueryRequest(agent, route, null, accessToken, {
          filters: JSON.stringify([filter]),
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.results).toEqual([]);
        expect(res.body.total).toBe(0);
      }
    });

    it('operations enforce company isolation', async () => {
      const db = KyselyServer.getInstance().db;
      expect(await getQueensByIds(db, 999_999, [insertId])).toEqual([]);
      expect(await updateQueenStatus(db, 999_999, 1, [insertId], false)).toBe(
        0,
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

    it('patch 200 - success', async () => {
      const res = await doRequest(agent, 'patch', route, null, accessToken, {
        ids: [insertId],
        data: {},
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(1);
    });
  });

  describe('/api/v1/queen/stats', () => {
    it('get 401 - no header', async () => {
      const res = await doQueryRequest(
        createAgent(),
        `${route}/stats`,
        null,
        null,
        null,
      );
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });

    it('get 200 - success', async () => {
      const res = await doQueryRequest(
        agent,
        `${route}/stats`,
        null,
        accessToken,
        null,
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toBeInstanceOf(Array);
      expect(res.body.total).toBeTypeOf('number');
    });

    it('applies all queen statistic filters', async () => {
      for (const filter of [
        { 'queens.mating_id': 999_999 },
        { 'queens.race_id': 999_999 },
        { 'queens.hive_id': '999999' },
        { 'hive_location.apiary_id': 999_999 },
      ]) {
        const res = await doQueryRequest(
          agent,
          `${route}/stats`,
          null,
          accessToken,
          { filters: JSON.stringify([filter]) },
        );
        expect(res.statusCode).toBe(200);
        expect(res.body.results).toEqual([]);
        expect(res.body.total).toBe(0);
      }
    });
  });

  describe('/api/v1/queen/pedigree/:id', () => {
    it('get 401 - no header', async () => {
      const res = await doQueryRequest(
        createAgent(),
        `${route}/pedigree/7850`,
        null,
        null,
        null,
      );
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });

    it('get 200 - success', async () => {
      const res = await doQueryRequest(
        agent,
        `${route}/pedigree/7850`,
        null,
        accessToken,
        null,
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
    });
  });

  describe('/api/v1/queen/batchGet', () => {
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

  describe('/api/v1/queen/status', () => {
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

  describe('/api/v1/queen/batchDelete', () => {
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
});
