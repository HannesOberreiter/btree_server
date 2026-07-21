import { beforeAll, describe, expect, it } from 'vitest';

import {
  getOptionsByIds,
  updateOptionStatus,
} from '../../src/api/modules/option.module.js';
import type { OptionTable } from '../../src/api/schemas/option.schema.js';
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
  name: 'test',
};

const options = [
  'charge_types',
  'hive_sources',
  'hive_types',
  'feed_types',
  'harvest_types',
  'checkup_types',
  'queen_matings',
  'queen_races',
  'treatment_diseases',
  'treatment_types',
  'treatment_vets',
] as const satisfies readonly OptionTable[];

options.forEach((option) => {
  describe(`${option} routes`, () => {
    const route = `/api/v1/option/${option}`;
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

    describe(`/api/v1/option/${option}`, () => {
      it('get 401 - no header', async () => {
        const res = await doQueryRequest(
          createAgent(),
          route,
          null,
          null,
          null,
        );
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
        expect(res.body).toBeInstanceOf(Array);
        const inserted = res.body.find(
          (item: { id: number }) => item.id === insertId,
        );
        expect(inserted).toMatchObject({
          id: insertId,
          name: testInsert.name,
          user_id: 1,
        });
        expect(inserted).toHaveProperty('created_at');
        expect(inserted).toHaveProperty('updated_at');
        if (option === 'charge_types') {
          expect(inserted).toHaveProperty('unit');
          expect(inserted).toHaveProperty('stock');
        }
        if (option === 'treatment_vets') {
          expect(inserted).toHaveProperty('note');
        }
      });

      it('operations enforce company isolation', async () => {
        const db = KyselyServer.getInstance().db;
        expect(await getOptionsByIds(db, option, 999_999, [insertId])).toEqual(
          [],
        );
        expect(
          await updateOptionStatus(db, option, 999_999, [insertId], false),
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

    describe(`/api/v1/option/${option}/batchGet`, () => {
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

    describe(`/api/v1/option/${option}/status`, () => {
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

    describe(`/api/v1/option/${option}/favorite`, () => {
      it('401 - no header', async () => {
        const res = await doRequest(
          createAgent(),
          'patch',
          `${route}/favorite`,
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
          `${route}/favorite`,
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
          `${route}/favorite`,
          null,
          accessToken,
          { ids: [insertId] },
        );
        expect(res.statusCode).toEqual(200);
        expect(res.body).toBe(1);
      });
    });

    describe(`/api/v1/option/${option}/batchDelete`, () => {
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
});
