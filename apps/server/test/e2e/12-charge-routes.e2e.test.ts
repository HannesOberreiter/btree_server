import { beforeAll, describe, expect, it } from 'vitest';

import {
  getChargesByIds,
  updateCharges,
} from '../../src/api/modules/charge.module.js';
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
  date: new Date().toISOString().slice(0, 10),
  bestbefore: new Date().toISOString().slice(0, 10),
  name: 'test',
  price: 1,
  amount: 12,
  type_id: 1,
  kind: 'out',
  note: '----',
  url: '',
};

describe('charge routes', () => {
  const route = '/api/v1/charge';
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

  describe('/api/v1/charge/', () => {
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

    it.each(['type.name', 'kind', 'deleted_at'])(
      'get 200 - orders by %s',
      async (order) => {
        const res = await doQueryRequest(agent, route, null, accessToken, {
          order,
          direction: 'desc',
        });
        expect(res.statusCode).toBe(200);
      },
    );

    it('filters charges by type', async () => {
      const res = await doQueryRequest(agent, route, null, accessToken, {
        filters: JSON.stringify([{ 'charges.type_id': 999_999 }]),
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.results).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('operations enforce company isolation', async () => {
      const db = KyselyServer.getInstance().db;
      expect(await getChargesByIds(db, 999_999, [insertId])).toEqual([]);
      expect(
        await updateCharges(
          db,
          999_999,
          1,
          { ids: [insertId], data: { name: 'must-not-change' } },
          false,
        ),
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

  describe('/api/v1/charge inventory mode', () => {
    it('creates only the adjustment needed to match counted stock', async () => {
      const typeResponse = await doRequest(
        agent,
        'post',
        '/api/v1/option/charge_types',
        null,
        accessToken,
        { name: 'inventory test', unit: 'kg', modus: true },
      );
      expect(typeResponse.statusCode).toBe(200);
      const typeId = typeResponse.body.id;

      const receipt = await doRequest(agent, 'post', route, null, accessToken, {
        kind: 'in',
        amount: 10,
        type_id: typeId,
      });
      expect(receipt.statusCode).toBe(200);

      const increase = await doRequest(
        agent,
        'post',
        route,
        null,
        accessToken,
        {
          kind: 'inventory',
          amount: 14,
          type_id: typeId,
          name: 'physical count',
          note: 'annual inventory',
        },
      );
      expect(increase.statusCode).toBe(200);
      expect(increase.body).toHaveLength(1);
      const increasedEntry = await getChargesByIds(
        KyselyServer.getInstance().db,
        1,
        increase.body,
      );
      expect(increasedEntry[0]).toMatchObject({
        kind: 'in',
        amount: 4,
        type_id: typeId,
        name: 'physical count',
        note: 'annual inventory',
      });

      const decrease = await doRequest(
        agent,
        'post',
        route,
        null,
        accessToken,
        { kind: 'inventory', amount: 3, type_id: typeId },
      );
      expect(decrease.statusCode).toBe(200);
      expect(decrease.body).toHaveLength(1);
      const decreasedEntry = await getChargesByIds(
        KyselyServer.getInstance().db,
        1,
        decrease.body,
      );
      expect(decreasedEntry[0]).toMatchObject({
        kind: 'out',
        amount: 11,
        type_id: typeId,
      });

      const unchanged = await doRequest(
        agent,
        'post',
        route,
        null,
        accessToken,
        { kind: 'inventory', amount: 3, type_id: typeId },
      );
      expect(unchanged.statusCode).toBe(200);
      expect(unchanged.body).toEqual([]);

      const stock = await doQueryRequest(
        agent,
        `${route}/stock`,
        null,
        accessToken,
        { q: 'inventory test' },
      );
      expect(stock.statusCode).toBe(200);
      expect(Number(stock.body.results[0].sum)).toBe(3);
    });

    it('serializes concurrent inventory counts', async () => {
      const typeResponse = await doRequest(
        agent,
        'post',
        '/api/v1/option/charge_types',
        null,
        accessToken,
        { name: 'concurrent inventory test', unit: 'kg', modus: true },
      );
      expect(typeResponse.statusCode).toBe(200);
      const typeId = typeResponse.body.id;
      const receipt = await doRequest(agent, 'post', route, null, accessToken, {
        kind: 'in',
        amount: 10,
        type_id: typeId,
      });
      expect(receipt.statusCode).toBe(200);

      const counts = await Promise.all(
        [12, 14].map(async (amount) => ({
          amount,
          response: await doRequest(agent, 'post', route, null, accessToken, {
            kind: 'inventory',
            amount,
            type_id: typeId,
          }),
        })),
      );
      expect(counts.every(({ response }) => response.statusCode === 200)).toBe(
        true,
      );
      const lastCount = counts.reduce((latest, count) =>
        count.response.body[0] > latest.response.body[0] ? count : latest,
      );

      const stock = await doQueryRequest(
        agent,
        `${route}/stock`,
        null,
        accessToken,
        { q: 'concurrent inventory test' },
      );
      expect(stock.statusCode).toBe(200);
      expect(Number(stock.body.results[0].sum)).toBe(lastCount.amount);
    });

    it('requires a valid type and non-negative counted amount', async () => {
      const missingType = await doRequest(
        agent,
        'post',
        route,
        null,
        accessToken,
        { kind: 'inventory', amount: 3 },
      );
      expect(missingType.statusCode).toBe(400);

      const invalidAmount = await doRequest(
        agent,
        'post',
        route,
        null,
        accessToken,
        { kind: 'inventory', amount: -1, type_id: 1 },
      );
      expect(invalidAmount.statusCode).toBe(400);

      const unknownType = await doRequest(
        agent,
        'post',
        route,
        null,
        accessToken,
        { kind: 'inventory', amount: 3, type_id: 999_999 },
      );
      expect(unknownType.statusCode).toBe(404);
    });
  });

  describe('/api/v1/charge/stock', () => {
    it('get 401 - no header', async () => {
      const res = await doQueryRequest(
        createAgent(),
        `${route}/stock`,
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
        `${route}/stock`,
        null,
        accessToken,
        null,
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toBeInstanceOf(Array);
      expect(res.body.total).toBeTypeOf('number');
    });
  });

  describe('/api/v1/charge/batchGet', () => {
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

  describe('/api/v1/charge/batchDelete', () => {
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
