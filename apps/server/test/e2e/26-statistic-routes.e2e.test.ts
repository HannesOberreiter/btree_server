import type {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  QueryResult,
  RootOperationNode,
  UnknownRow,
} from 'kysely';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  getVarroaStatistics,
  listHiveCountByApiary,
  listHiveCountTotal,
  listHiveRatingStatistics,
  listTaskStatisticsByHive,
  listTaskStatisticsSummary,
} from '../../src/api/modules/statistic.module.js';
import type { StatisticTask } from '../../src/api/schemas/statistic.schema.js';
import { KyselyServer } from '../../src/servers/kysely.server.js';
import type { TestAgent } from '../utils.js';
import {
  createAgent,
  createAuthenticatedAgent,
  doQueryRequest,
} from '../utils.js';

class QueryCapturePlugin implements KyselyPlugin {
  constructor(private readonly queries: string[]) {}

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    this.queries.push(JSON.stringify(args.node));
    return args.node;
  }

  transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    return Promise.resolve(args.result);
  }
}

describe('statistic routes', () => {
  const route = '/api/v1/statistic';
  let agent: TestAgent;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
  });

  it('401 - requires authentication', async () => {
    const res = await doQueryRequest(
      createAgent(),
      `${route}/hive_count_total`,
      null,
      null,
      null,
    );
    expect(res.statusCode).toBe(401);
  });

  it('returns hive-count statistics', async () => {
    const total = await doQueryRequest(
      agent,
      `${route}/hive_count_total`,
      null,
      null,
      null,
    );
    const apiary = await doQueryRequest(
      agent,
      `${route}/hive_count_apiary`,
      null,
      null,
      { date: new Date().toISOString() },
    );
    expect(total.statusCode).toBe(200);
    expect(total.body).toBeInstanceOf(Array);
    expect(apiary.statusCode).toBe(200);
    expect(apiary.body).toBeInstanceOf(Array);
  });

  for (const task of ['feed', 'harvest', 'treatment'] as const) {
    it(`returns ${task} statistics`, async () => {
      const hive = await doQueryRequest(
        agent,
        `${route}/${task}/hive`,
        null,
        null,
        { offset: 0, limit: 10 },
      );
      expect(hive.statusCode).toBe(200);
      expect(hive.body.results).toBeInstanceOf(Array);
      expect(hive.body.total).toBeTypeOf('number');
      if (hive.body.results.length > 0) {
        expect(hive.body.results[0]).toEqual(
          expect.objectContaining({
            year: expect.any(Number),
            hive_id: expect.any(Number),
            hive: expect.objectContaining({
              id: expect.any(Number),
              name: expect.any(String),
            }),
          }),
        );
      }
      for (const mode of ['year', 'apiary', 'type']) {
        const summary = await doQueryRequest(
          agent,
          `${route}/${task}/${mode}`,
          null,
          null,
          {},
        );
        expect(summary.statusCode).toBe(200);
        expect(summary.body).toBeInstanceOf(Array);
        if (summary.body.length > 0) {
          if (mode === 'year') {
            expect(summary.body[0].year).toBeTypeOf('number');
          } else if (mode === 'apiary') {
            expect(summary.body[0]).toHaveProperty('task_apiary');
          } else {
            expect(summary.body[0]).toHaveProperty('type');
          }
        }
      }
    });
  }

  it('filters hive statistics by scalar and array hive IDs', async () => {
    const db = KyselyServer.getInstance().db;
    const firstHive = await db
      .insertInto('hives')
      .values({ name: 'stat-filter-a', user_id: 1, deleted: false })
      .executeTakeFirstOrThrow();
    const secondHive = await db
      .insertInto('hives')
      .values({ name: 'stat-filter-b', user_id: 1, deleted: false })
      .executeTakeFirstOrThrow();
    const firstHiveId = Number(firstHive.insertId);
    const secondHiveId = Number(secondHive.insertId);
    const taskRows = [
      {
        amount: '10',
        date: new Date('2025-07-01'),
        deleted: false,
        hive_id: firstHiveId,
        user_id: 1,
      },
      {
        amount: '20',
        date: new Date('2025-07-01'),
        deleted: false,
        hive_id: secondHiveId,
        user_id: 1,
      },
    ];
    await db.insertInto('harvests').values(taskRows).execute();
    await db.insertInto('feeds').values(taskRows).execute();
    await db.insertInto('treatments').values(taskRows).execute();
    await db
      .insertInto('checkups')
      .values(
        taskRows.map(({ date, deleted, hive_id, user_id }) => ({
          brood: 1,
          calm_comb: 1,
          comb: 1,
          pollen: 1,
          strong: 1,
          swarm: 1,
          temper: 1,
          varroa: 1,
          date,
          deleted,
          hive_id,
          user_id,
        })),
      )
      .execute();

    try {
      for (const task of ['harvest', 'feed', 'treatment', 'rating']) {
        for (const filter of [
          { hive_id: String(firstHiveId) },
          { hive_id_array: [firstHiveId] },
          { hive_id_array_exclude: [secondHiveId] },
        ]) {
          const filtered = await doQueryRequest(
            agent,
            `${route}/${task}/hive`,
            null,
            null,
            {
              filters: JSON.stringify([filter]),
              limit: 10_000,
              groupByType: true,
            },
          );
          expect(filtered.statusCode).toBe(200);
          expect(filtered.body.results).toHaveLength(1);
          expect(filtered.body.results[0].hive_id).toBe(firstHiveId);
          expect(filtered.body.total).toBe(1);
        }
      }
    } finally {
      for (const table of [
        'harvests',
        'feeds',
        'treatments',
        'checkups',
      ] as const) {
        await db
          .deleteFrom(table)
          .where('hive_id', 'in', [firstHiveId, secondHiveId])
          .execute();
      }
      await db
        .deleteFrom('hives')
        .where('id', 'in', [firstHiveId, secondHiveId])
        .execute();
    }
  });

  it('returns rating and Varroa statistics', async () => {
    const rating = await doQueryRequest(
      agent,
      `${route}/rating/hive`,
      null,
      null,
      { offset: 0, limit: 10 },
    );
    const varroa = await doQueryRequest(agent, `${route}/varroa`, null, null, {
      start_date: '2020-01-01',
      end_date: '2030-12-31',
      hive_ids: [1],
    });
    expect(rating.statusCode).toBe(200);
    expect(rating.body.results).toBeInstanceOf(Array);
    expect(varroa.statusCode).toBe(200);
    expect(varroa.body).toEqual(
      expect.objectContaining({
        datasetCheckup: expect.any(Object),
        datasetTreatment: expect.any(Object),
        stats: expect.any(Array),
      }),
    );
  });

  it('queries only tables for the requested task statistics', async () => {
    const db = KyselyServer.getInstance().db;
    const tableNames = {
      feed: ['feeds', 'feeds_apiaries', 'feed_types'],
      harvest: ['harvests', 'harvests_apiaries', 'harvest_types'],
      treatment: ['treatments', 'treatments_apiaries', 'treatment_types'],
    } as const;

    for (const task of ['feed', 'harvest', 'treatment'] as const) {
      const queries: string[] = [];
      const instrumentedDb = db.withPlugin(new QueryCapturePlugin(queries));
      await listTaskStatisticsSummary(
        instrumentedDb,
        999_999,
        task,
        'year',
        {},
      );

      const queryNodes = queries.join('\n');
      for (const selectedTable of tableNames[task]) {
        expect(queryNodes).toContain(`"name":"${selectedTable}"`);
      }
      for (const otherTask of ['feed', 'harvest', 'treatment'] as const) {
        if (otherTask === task) continue;
        for (const unrelatedTable of tableNames[otherTask]) {
          expect(queryNodes).not.toContain(`"name":"${unrelatedTable}"`);
        }
      }
    }
  });

  it('operations enforce company isolation', async () => {
    const db = KyselyServer.getInstance().db;
    const companyId = 999_999;
    const listInput = { offset: 0, limit: 10 };
    const summaryInput = {};
    const taskResults = await Promise.all(
      (['feed', 'harvest', 'treatment'] as StatisticTask[]).flatMap((task) => [
        listTaskStatisticsByHive(db, companyId, task, listInput),
        listTaskStatisticsSummary(db, companyId, task, 'year', summaryInput),
      ]),
    );
    expect(await listHiveCountTotal(db, companyId)).toEqual([]);
    expect(await listHiveCountByApiary(db, companyId, new Date())).toEqual([]);
    expect(await listHiveRatingStatistics(db, companyId, listInput)).toEqual({
      results: [],
      total: 0,
    });
    expect(
      await getVarroaStatistics(db, companyId, {
        start_date: '2020-01-01',
        end_date: '2030-12-31',
        hive_ids: [1],
      }),
    ).toEqual({ datasetCheckup: {}, datasetTreatment: {}, stats: [] });
    expect(
      taskResults.every((result) =>
        Array.isArray(result) ? result.length === 0 : result.total === 0,
      ),
    ).toBe(true);
  });
});
