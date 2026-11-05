import { PassThrough } from 'node:stream';
import { buffer } from 'node:stream/consumers';

import { ZipArchive } from 'archiver';
import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  downloadCompanyData,
  importCompanyArchive,
} from '../../src/api/modules/company_transfer.module.js';
import { executeWizBeeTool } from '../../src/api/modules/wizbee_tools.module.js';
import { ROLES } from '../../src/config/constants.config.js';
import { KyselyServer } from '../../src/servers/kysely.server.js';
import type { TestAgent } from '../utils.js';
import { createAuthenticatedAgent, demoUser } from '../utils.js';

const db = KyselyServer.getInstance().db;
const today = new Date().toISOString().slice(0, 10);

describe('task stock bookings', () => {
  let agent: TestAgent;
  let companyId: number;
  let beeId: number;
  let hiveIds: number[];
  let sugarId: number;
  let superId: number;
  let honeyId: number;
  let syrupId: number;
  let plainFeedId: number;
  let superOnId: number;
  let acaciaId: number;
  let acidId: number;
  let oxalicId: number;

  async function post(path: string, body: unknown) {
    return agent.request('POST', `/api/v1${path}`, body);
  }
  async function patch(path: string, body: unknown, query?: object) {
    return agent.request(
      'PATCH',
      `/api/v1${path}`,
      body,
      query as Record<string, unknown>,
    );
  }
  async function createOption(table: string, name: string, unit?: string) {
    const res = await post(`/option/${table}`, { name, unit });
    expect(res.statusCode).toEqual(200);
    return res.body.id as number;
  }
  function linkedCharges(
    column: 'feed_id' | 'treatment_id' | 'harvest_id' | 'checkup_id',
  ) {
    return (taskIds: number[]) =>
      db
        .selectFrom('charges')
        .select([
          'id',
          'kind',
          'type_id',
          'date',
          'deleted',
          column,
          sql<number>`CAST(amount AS DOUBLE)`.as('value'),
        ])
        .where(column, 'in', taskIds)
        .orderBy('id')
        .execute();
  }
  const feedCharges = linkedCharges('feed_id');
  async function stock(typeId: number) {
    const row = await db
      .selectFrom('charge_stocks')
      .select('sum')
      .where('type_id', '=', typeId)
      .executeTakeFirst();
    return Number(row?.sum ?? 0);
  }
  async function setSyrupFactor(factor: number) {
    const res = await patch(`/option/feed_types/${syrupId}/recipe`, {
      lines: [
        {
          charge_type_id: sugarId,
          kind: 'out',
          mode: 'per_amount',
          factor,
        },
      ],
    });
    expect(res.statusCode).toEqual(200);
  }
  async function createFeed(body: Record<string, unknown>) {
    const res = await post('/feed', {
      hive_ids: hiveIds,
      date: today,
      type_id: syrupId,
      amount: 10,
      done: true,
      ...body,
    });
    expect(res.statusCode).toEqual(200);
    return res.body as number[];
  }

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
    const bee = await db
      .selectFrom('bees')
      .select('id')
      .where('email', '=', demoUser.email)
      .executeTakeFirstOrThrow();
    beeId = bee.id;
    const hive = await db
      .selectFrom('hives')
      .select('user_id')
      .where('id', '=', 1)
      .executeTakeFirstOrThrow();
    companyId = Number(hive.user_id);
    const hives = await db
      .selectFrom('hives')
      .select('id')
      .where('user_id', '=', companyId)
      .where('deleted', '=', false)
      .orderBy('id')
      .limit(2)
      .execute();
    hiveIds = hives.map((row) => row.id);
    expect(hiveIds).toHaveLength(2);

    sugarId = await createOption('charge_types', 'Stock test sugar', 'kg');
    superId = await createOption('charge_types', 'Stock test super', 'pcs');
    honeyId = await createOption('charge_types', 'Stock test honey', 'kg');
    syrupId = await createOption('feed_types', 'Stock test 3:2', 'l');
    plainFeedId = await createOption('feed_types', 'Stock test plain');
    superOnId = await createOption('checkup_types', 'Stock test super on');
    acaciaId = await createOption('harvest_types', 'Stock test acacia', 'kg');
    acidId = await createOption('charge_types', 'Stock test oxalic acid', 'g');
    oxalicId = await createOption('treatment_types', 'Stock test oxalic', 'g');
  });

  afterAll(async () => {
    await db
      .updateTable('company_bee')
      .set({ rank: ROLES.admin })
      .where('user_id', '=', companyId)
      .where('bee_id', '=', beeId)
      .execute();
  });

  describe('task type unit and recipe routes', () => {
    it('stores the unit of task types', async () => {
      const [type] = await db
        .selectFrom('feed_types')
        .select('unit')
        .where('id', '=', syrupId)
        .execute();
      expect(type.unit).toEqual('l');

      const res = await patch('/option/harvest_types', {
        ids: [acaciaId],
        data: { unit: 'g' },
      });
      expect(res.statusCode).toEqual(200);
      const list = await agent.request('GET', '/api/v1/option/harvest_types');
      expect(
        list.body.find((row: { id: number }) => row.id === acaciaId).unit,
      ).toEqual('g');
    });

    it('replaces and lists recipe lines', async () => {
      const res = await agent.request(
        'PATCH',
        `/api/v1/option/feed_types/${syrupId}/recipe`,
        {
          lines: [
            {
              charge_type_id: sugarId,
              kind: 'out',
              mode: 'per_amount',
              factor: 0.79,
            },
          ],
        },
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([
        {
          id: expect.any(Number),
          type_id: syrupId,
          charge_type_id: sugarId,
          kind: 'out',
          mode: 'per_amount',
          factor: 0.79,
        },
      ]);

      const list = await agent.request(
        'GET',
        '/api/v1/option/feed_types/recipe',
      );
      expect(list.statusCode).toEqual(200);
      expect(list.body).toContainEqual(res.body[0]);

      const checkup = await agent.request(
        'PATCH',
        `/api/v1/option/checkup_types/${superOnId}/recipe`,
        {
          lines: [
            {
              charge_type_id: superId,
              kind: 'out',
              mode: 'per_hive',
              factor: 1,
            },
          ],
        },
      );
      expect(checkup.statusCode).toEqual(200);
      const harvest = await agent.request(
        'PATCH',
        `/api/v1/option/harvest_types/${acaciaId}/recipe`,
        {
          lines: [
            {
              charge_type_id: honeyId,
              kind: 'in',
              mode: 'per_amount',
              factor: 1,
            },
          ],
        },
      );
      expect(harvest.statusCode).toEqual(200);
    });

    it('400 - checkup recipe needs per_hive', async () => {
      const res = await agent.request(
        'PATCH',
        `/api/v1/option/checkup_types/${superOnId}/recipe`,
        {
          lines: [
            {
              charge_type_id: superId,
              kind: 'out',
              mode: 'per_amount',
              factor: 1,
            },
          ],
        },
      );
      expect(res.statusCode).toEqual(400);
    });

    it('400 - table without recipes', async () => {
      const res = await agent.request(
        'GET',
        '/api/v1/option/hive_types/recipe',
      );
      expect(res.statusCode).toEqual(400);
    });

    it('404 - foreign charge type', async () => {
      const res = await agent.request(
        'PATCH',
        `/api/v1/option/feed_types/${plainFeedId}/recipe`,
        {
          lines: [
            {
              charge_type_id: 999_999,
              kind: 'out',
              mode: 'per_amount',
              factor: 1,
            },
          ],
        },
      );
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('booking', () => {
    it('books nothing for a task type without recipe', async () => {
      const ids = await createFeed({ type_id: plainFeedId });
      expect(await feedCharges(ids)).toEqual([]);
    });

    it('books one charge row per done task row from the recipe', async () => {
      const before = await stock(sugarId);
      const ids = await createFeed({});
      const charges = await feedCharges(ids);
      expect(charges).toHaveLength(2);
      expect(charges.map((row) => row.feed_id)).toEqual(ids);
      expect(charges[0]).toMatchObject({
        kind: 'out',
        type_id: sugarId,
        value: 7.9,
        deleted: false,
      });
      expect(await stock(sugarId)).toBeCloseTo(before - 15.8);
    });

    it('books planned tasks only when they are marked done', async () => {
      const ids = await createFeed({ done: false });
      expect(await feedCharges(ids)).toEqual([]);

      let res = await patch('/feed/status', { ids, status: true });
      expect(res.statusCode).toEqual(200);
      expect(await feedCharges(ids)).toHaveLength(2);

      res = await patch('/feed/status', { ids, status: false });
      expect(res.statusCode).toEqual(200);
      expect(await feedCharges(ids)).toEqual([]);
    });

    it('keeps bookings when an unrelated field changes', async () => {
      const ids = await createFeed({});
      const before = await feedCharges(ids);
      const res = await patch('/feed', {
        ids,
        data: { note: 'changed', amount: 10, type_id: syrupId, done: true },
      });
      expect(res.statusCode).toEqual(200);
      expect(await feedCharges(ids)).toEqual(before);
    });

    it('recalculates bookings when the amount changes', async () => {
      const ids = await createFeed({});
      const res = await patch('/feed', { ids, data: { amount: 20 } });
      expect(res.statusCode).toEqual(200);
      const charges = await feedCharges(ids);
      expect(charges.map((row) => row.value)).toEqual([15.8, 15.8]);
    });

    it('rebooks from the new recipe when the type changes', async () => {
      const fondantId = await createOption('feed_types', 'Stock test fondant');
      const recipe = await patch(`/option/feed_types/${fondantId}/recipe`, {
        lines: [
          {
            charge_type_id: sugarId,
            kind: 'out',
            mode: 'per_amount',
            factor: 1,
          },
        ],
      });
      expect(recipe.statusCode).toEqual(200);
      const ids = await createFeed({});

      const res = await patch('/feed', { ids, data: { type_id: fondantId } });
      expect(res.statusCode).toEqual(200);
      const charges = await feedCharges(ids);
      expect(charges.map((row) => row.value)).toEqual([10, 10]);
      const names = await db
        .selectFrom('charges')
        .select('name')
        .where('feed_id', 'in', ids)
        .execute();
      expect(names.map((row) => row.name)).toEqual([
        'Stock test fondant',
        'Stock test fondant',
      ]);

      // The export test expects only syrup bookings.
      const removed = await patch('/feed/batchDelete', { ids }, { hard: true });
      expect(removed.statusCode).toEqual(200);
    });

    it('removes bookings when the type changes to a type without recipe', async () => {
      const before = await stock(sugarId);
      const ids = await createFeed({});
      expect(await stock(sugarId)).toBeCloseTo(before - 15.8);

      const res = await patch('/feed', { ids, data: { type_id: plainFeedId } });
      expect(res.statusCode).toEqual(200);
      expect(await feedCharges(ids)).toEqual([]);
      expect(await stock(sugarId)).toBeCloseTo(before);
    });

    it('uses a given charges list and an empty list', async () => {
      const ids = await createFeed({
        charges: [{ charge_type_id: sugarId, kind: 'out', amount: 3 }],
      });
      expect((await feedCharges(ids)).map((row) => row.value)).toEqual([3, 3]);

      const res = await patch('/feed', { ids, data: { charges: [] } });
      expect(res.statusCode).toEqual(200);
      expect(await feedCharges(ids)).toEqual([]);
    });

    it('does not book on edit when the task has no bookings', async () => {
      const ids = await createFeed({ charges: [] });
      const res = await patch('/feed', { ids, data: { amount: 30 } });
      expect(res.statusCode).toEqual(200);
      expect(await feedCharges(ids)).toEqual([]);
    });

    it('books on a type change when the task has no bookings', async () => {
      const ids = await createFeed({ type_id: plainFeedId });
      expect(await feedCharges(ids)).toEqual([]);

      let res = await patch('/feed', { ids, data: { type_id: syrupId } });
      expect(res.statusCode).toEqual(200);
      expect((await feedCharges(ids)).map((row) => row.value)).toEqual([
        7.9, 7.9,
      ]);

      // A task with booking turned off books again on a type change.
      res = await patch('/feed', { ids, data: { charges: [] } });
      expect(res.statusCode).toEqual(200);
      res = await patch('/feed', { ids, data: { type_id: plainFeedId } });
      expect(res.statusCode).toEqual(200);
      res = await patch('/feed', { ids, data: { type_id: syrupId } });
      expect(res.statusCode).toEqual(200);
      expect(await feedCharges(ids)).toHaveLength(2);
    });

    it('404 - foreign charge type in the charges list', async () => {
      const res = await post('/feed', {
        hive_ids: hiveIds,
        date: today,
        done: true,
        charges: [{ charge_type_id: 999_999, kind: 'out', amount: 1 }],
      });
      expect(res.statusCode).toEqual(404);
    });

    it('moves bookings with the task date', async () => {
      const ids = await createFeed({});
      const res = await patch('/feed/date', {
        ids,
        start: '2026-03-01',
        end: '2026-03-01',
      });
      expect(res.statusCode).toEqual(200);
      const charges = await feedCharges(ids);
      expect(charges).toHaveLength(2);
      for (const charge of charges)
        expect(String(charge.date)).toEqual('2026-03-01');
    });

    it('mirrors soft delete, restore, and hard delete', async () => {
      const ids = await createFeed({});
      let res = await patch('/feed/batchDelete', { ids });
      expect(res.statusCode).toEqual(200);
      expect((await feedCharges(ids)).map((row) => row.deleted)).toEqual([
        true,
        true,
      ]);

      res = await patch('/feed/batchDelete', { ids }, { restore: true });
      expect(res.statusCode).toEqual(200);
      expect((await feedCharges(ids)).map((row) => row.deleted)).toEqual([
        false,
        false,
      ]);

      const chargeIds = (await feedCharges(ids)).map((row) => row.id);
      res = await patch('/feed/batchDelete', { ids }, { hard: true });
      expect(res.statusCode).toEqual(200);
      const left = await db
        .selectFrom('charges')
        .select('id')
        .where('id', 'in', chargeIds)
        .execute();
      expect(left).toEqual([]);
    });

    it('unlinks a booking that is changed by hand', async () => {
      const ids = await createFeed({});
      const [first] = await feedCharges(ids);
      let res = await patch('/charge', {
        ids: [first.id],
        data: { amount: 5 },
      });
      expect(res.statusCode).toEqual(200);
      const changed = await db
        .selectFrom('charges')
        .select(['feed_id', 'amount'])
        .where('id', '=', first.id)
        .executeTakeFirstOrThrow();
      expect(changed.feed_id).toBeNull();

      res = await patch('/feed', { ids, data: { amount: 20 } });
      expect(res.statusCode).toEqual(200);
      const after = await db
        .selectFrom('charges')
        .select(['feed_id', 'amount'])
        .where('id', '=', first.id)
        .executeTakeFirstOrThrow();
      expect(Number(after.amount)).toEqual(5);
      expect((await feedCharges([ids[1]])).map((row) => row.value)).toEqual([
        15.8,
      ]);
    });

    it('unlinks a booking that is deleted by hand', async () => {
      const ids = await createFeed({});
      const [first] = await feedCharges(ids);
      let res = await patch('/charge/batchDelete', { ids: [first.id] });
      expect(res.statusCode).toEqual(200);

      res = await patch('/feed', { ids, data: { amount: 20 } });
      expect(res.statusCode).toEqual(200);
      const deleted = await db
        .selectFrom('charges')
        .select(['feed_id', 'deleted', 'amount'])
        .where('id', '=', first.id)
        .executeTakeFirstOrThrow();
      expect(deleted.feed_id).toBeNull();
      expect(Boolean(deleted.deleted)).toBe(true);
      expect(Number(deleted.amount)).toEqual(7.9);
      expect((await feedCharges(ids)).map((row) => row.value)).toEqual([15.8]);

      res = await patch(
        '/charge/batchDelete',
        { ids: [first.id] },
        {
          restore: true,
        },
      );
      expect(res.statusCode).toEqual(200);
      expect((await feedCharges([ids[0]])).map((row) => row.id)).toEqual([]);
    });

    it('books treatments and recalculates them on edit', async () => {
      let res = await patch(`/option/treatment_types/${oxalicId}/recipe`, {
        lines: [
          {
            charge_type_id: acidId,
            kind: 'out',
            mode: 'per_amount',
            factor: 1,
          },
        ],
      });
      expect(res.statusCode).toEqual(200);
      res = await post('/treatment', {
        hive_ids: hiveIds,
        date: today,
        type_id: oxalicId,
        amount: 3.5,
        done: true,
      });
      expect(res.statusCode).toEqual(200);
      const ids = res.body as number[];
      const treatmentCharges = linkedCharges('treatment_id');
      expect(
        (await treatmentCharges(ids)).map((row) => [
          row.kind,
          row.type_id,
          row.value,
        ]),
      ).toEqual([
        ['out', acidId, 3.5],
        ['out', acidId, 3.5],
      ]);

      res = await patch('/treatment', { ids, data: { amount: 4 } });
      expect(res.statusCode).toEqual(200);
      expect((await treatmentCharges(ids)).map((row) => row.value)).toEqual([
        4, 4,
      ]);
    });

    it('removes the bookings of a permanently deleted hive', async () => {
      let res = await post('/hive', {
        name: 'Stock test hive',
        apiary_id: 1,
        date: today,
        source_id: 1,
        type_id: 1,
        start: 0,
        repeat: 1,
      });
      expect(res.statusCode).toEqual(200);
      const hiveId = res.body[0] as number;
      const before = await stock(sugarId);
      const ids = await createFeed({ hive_ids: [hiveId] });
      expect(await stock(sugarId)).toBeCloseTo(before - 7.9);

      res = await patch('/hive/batchDelete', { ids: [hiveId] }, { hard: true });
      expect(res.statusCode).toEqual(200);
      expect(await feedCharges(ids)).toEqual([]);
      expect(await stock(sugarId)).toBeCloseTo(before);
    });

    it('keeps bookings when the recipe changes later', async () => {
      const ids = await createFeed({});
      await setSyrupFactor(0.8);
      expect((await feedCharges(ids)).map((row) => row.value)).toEqual([
        7.9, 7.9,
      ]);
    });

    it('books checkups per hive and harvests into stock', async () => {
      const checkup = await post('/checkup', {
        hive_ids: hiveIds,
        date: today,
        interval: 0,
        repeat: 0,
        type_id: superOnId,
        done: true,
      });
      expect(checkup.statusCode).toEqual(200);
      const checkupCharges = await linkedCharges('checkup_id')(checkup.body);
      expect(
        checkupCharges.map((row) => [row.kind, row.type_id, row.value]),
      ).toEqual([
        ['out', superId, 1],
        ['out', superId, 1],
      ]);

      const harvest = await post('/harvest', {
        hive_ids: [hiveIds[0]],
        date: today,
        type_id: acaciaId,
        amount: 12.5,
        done: true,
      });
      expect(harvest.statusCode).toEqual(200);
      const harvestCharges = await linkedCharges('harvest_id')(harvest.body);
      expect(
        harvestCharges.map((row) => [row.kind, row.type_id, row.value]),
      ).toEqual([['in', honeyId, 12.5]]);
    });

    it('returns bookings in batchGet and the source in the charge list', async () => {
      await setSyrupFactor(0.8);
      const ids = await createFeed({});
      const res = await post('/feed/batchGet', { ids });
      expect(res.statusCode).toEqual(200);
      expect(res.body[0].charges).toEqual([
        {
          id: expect.any(Number),
          charge_type_id: sugarId,
          kind: 'out',
          amount: 8,
        },
      ]);

      const list = await agent.request('GET', '/api/v1/charge', undefined, {
        limit: 100,
        order: 'id',
        direction: 'desc',
      });
      expect(list.statusCode).toEqual(200);
      const charge = list.body.results.find(
        (row: { id: number }) => row.id === res.body[0].charges[0].id,
      );
      expect(charge.feed_id).toEqual(ids[0]);
      expect(charge.name).toEqual('Stock test 3:2');
      expect(charge.source).toEqual({
        task: 'feed',
        id: ids[0],
        hive_id: hiveIds[0],
        hive_name: expect.any(String),
      });
    });

    it('reports stock bookings in WizBee tool results', async () => {
      await setSyrupFactor(0.8);
      const result = await executeWizBeeTool(
        db,
        'createFeed',
        {
          hiveIds,
          date: today,
          typeId: syrupId,
          amount: 10,
          done: true,
        },
        { userId: companyId, beeId, rank: ROLES.admin },
      );
      expect(result).toMatchObject({
        success: true,
        stockBookings: [
          {
            charge_type_id: sugarId,
            name: 'Stock test sugar',
            unit: 'kg',
            kind: 'out',
            amount: 16,
            rows: 2,
          },
        ],
      });
    });

    it('403 - read-only users cannot change charges', async () => {
      await db
        .updateTable('company_bee')
        .set({ rank: ROLES.read })
        .where('user_id', '=', companyId)
        .where('bee_id', '=', beeId)
        .execute();
      try {
        const readOnly = await createAuthenticatedAgent();
        const res = await readOnly.request('PATCH', '/api/v1/charge', {
          ids: [1],
          data: { note: 'x' },
        });
        expect(res.statusCode).toEqual(403);
      } finally {
        await db
          .updateTable('company_bee')
          .set({ rank: ROLES.admin })
          .where('user_id', '=', companyId)
          .where('bee_id', '=', beeId)
          .execute();
      }
    });
  });

  describe('company export and import', () => {
    it('keeps units, recipes, and booking links', async () => {
      const archive = new ZipArchive();
      const output = new PassThrough();
      archive.pipe(output);
      const contents = buffer(output);
      await downloadCompanyData(db, archive, companyId);
      await archive.finalize();

      const { name } = await importCompanyArchive(db, beeId, await contents);
      const company = await db
        .selectFrom('companies')
        .select('id')
        .where('name', '=', name)
        .executeTakeFirstOrThrow();

      const syrup = await db
        .selectFrom('feed_types')
        .select(['id', 'unit'])
        .where('user_id', '=', company.id)
        .where('name', '=', 'Stock test 3:2')
        .executeTakeFirstOrThrow();
      expect(syrup.unit).toEqual('l');
      const lines = await db
        .selectFrom('task_type_stock_lines')
        .innerJoin(
          'charge_types',
          'charge_types.id',
          'task_type_stock_lines.charge_type_id',
        )
        .select(['charge_types.name', 'charge_types.user_id'])
        .where('task_type_stock_lines.feed_type_id', '=', syrup.id)
        .execute();
      expect(lines).toEqual([
        { name: 'Stock test sugar', user_id: company.id },
      ]);

      const linked = await db
        .selectFrom('charges')
        .innerJoin('feeds', 'feeds.id', 'charges.feed_id')
        .select(['feeds.user_id', 'feeds.type_id'])
        .where('charges.user_id', '=', company.id)
        .execute();
      expect(linked.length).toBeGreaterThan(0);
      for (const row of linked) {
        expect(row.user_id).toEqual(company.id);
        expect(row.type_id).toEqual(syrup.id);
      }
    });
  });
});
