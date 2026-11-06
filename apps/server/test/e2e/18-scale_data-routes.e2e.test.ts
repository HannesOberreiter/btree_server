import { beforeAll, describe, expect, it } from 'vitest';

import {
  getScaleDataByIds,
  updateScaleData,
} from '../../src/api/modules/scale_data.module.js';
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
  scale_id: 1,
  datetime: new Date().toISOString().replace('Z', '').replace('T', ' '),
  weight: 1,
  temp1: 2,
  temp2: 2.5,
  note: '----',
};

describe('scale Data routes', () => {
  const route = '/api/v1/scale_data';
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
    expect(res2.body).toBeTypeOf('object');
    insertId = res2.body.id;
  });

  describe('/api/v1/scale_data/', () => {
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
      const reading = res.body.results.find(
        (item: { id: number }) => item.id === insertId,
      );
      expect(reading).toMatchObject({
        id: insertId,
        scale_id: testInsert.scale_id,
      });
      expect(reading.scale).toMatchObject({ id: testInsert.scale_id });
      expect(reading.scale.hive).toHaveProperty('grouphive');
      expect(reading.scale.hive).toHaveProperty('created_at');
    });

    it('operations enforce company isolation', async () => {
      const db = KyselyServer.getInstance().db;
      expect(await getScaleDataByIds(db, 999_999, { ids: [insertId] })).toEqual(
        [],
      );
      expect(
        await updateScaleData(db, 999_999, {
          ids: [insertId],
          data: { weight: 999 },
        }),
      ).toBe(0);
    });

    it('accepts external demo readings through Kysely operations', async () => {
      const db = KyselyServer.getInstance().db;
      const scale = await db
        .selectFrom('scales')
        .select('name')
        .where('id', '=', testInsert.scale_id)
        .executeTakeFirstOrThrow();
      const apiKey = `scale-data-e2e-${insertId}`;
      await db
        .updateTable('companies')
        .set({ api_key: apiKey, paid: new Date('2099-01-01T00:00:00Z') })
        .where('id', '=', 1)
        .executeTakeFirst();

      const res = await doQueryRequest(
        createAgent(),
        `/api/v1/external/scale/${encodeURIComponent(scale.name ?? '')}/${apiKey}`,
        null,
        null,
        { action: 'CREATE_DEMO', weight: 1 },
      );
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        weight: 1,
        scale_id: testInsert.scale_id,
      });
      expect(res.body).not.toHaveProperty('id');
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
        data: { weight: '2.00' },
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(1);
    });
  });

  describe('/api/v1/scale_data/batchGet', () => {
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

  describe('/api/v1/scale_data/batchDelete', () => {
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
