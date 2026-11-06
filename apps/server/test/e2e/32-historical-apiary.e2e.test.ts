import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { listWaxOperations } from '../../src/api/modules/wax.module.js';
import { KyselyServer } from '../../src/servers/kysely.server.js';

const taskDate = new Date('2026-06-01T00:00:00.000Z');
const laterDate = new Date('2026-07-01T00:00:00.000Z');

let companyId = 0;
let foreignCompanyId = 0;
let firstApiaryId = 0;
let latestApiaryId = 0;
let foreignApiaryId = 0;
let hiveId = 0;
let feedId = 0;
let harvestId = 0;
let laterHarvestId = 0;
let treatmentId = 0;
let checkupId = 0;
let waxOperationId = 0;
const movementIds: number[] = [];

describe('historical apiary resolution', () => {
  const db = KyselyServer.getInstance().db;

  beforeAll(async () => {
    const company = await db
      .insertInto('companies')
      .values({ name: `Historical location ${Date.now()}` })
      .executeTakeFirstOrThrow();
    companyId = Number(company.insertId);
    const foreignCompany = await db
      .insertInto('companies')
      .values({ name: `Foreign historical location ${Date.now()}` })
      .executeTakeFirstOrThrow();
    foreignCompanyId = Number(foreignCompany.insertId);

    const firstApiary = await db
      .insertInto('apiaries')
      .values({
        name: 'First historical apiary',
        latitude: 0,
        longitude: 0,
        user_id: companyId,
      })
      .executeTakeFirstOrThrow();
    firstApiaryId = Number(firstApiary.insertId);
    const latestApiary = await db
      .insertInto('apiaries')
      .values({
        name: 'Latest historical apiary',
        latitude: 0,
        longitude: 0,
        user_id: companyId,
      })
      .executeTakeFirstOrThrow();
    latestApiaryId = Number(latestApiary.insertId);
    const foreignApiary = await db
      .insertInto('apiaries')
      .values({
        name: 'Foreign historical apiary',
        latitude: 0,
        longitude: 0,
        user_id: foreignCompanyId,
      })
      .executeTakeFirstOrThrow();
    foreignApiaryId = Number(foreignApiary.insertId);

    const hive = await db
      .insertInto('hives')
      .values({ name: 'Historical location hive', user_id: companyId })
      .executeTakeFirstOrThrow();
    hiveId = Number(hive.insertId);

    for (const movement of [
      { apiary_id: firstApiaryId, date: new Date('2026-01-01T12:00:00Z') },
      { apiary_id: firstApiaryId, date: new Date('2026-06-01T08:00:00Z') },
      { apiary_id: latestApiaryId, date: new Date('2026-06-01T08:00:00Z') },
      { apiary_id: foreignApiaryId, date: laterDate },
    ]) {
      const result = await db
        .insertInto('movedates')
        .values({ ...movement, hive_id: hiveId })
        .executeTakeFirstOrThrow();
      movementIds.push(Number(result.insertId));
    }

    const feed = await db
      .insertInto('feeds')
      .values({ date: taskDate, hive_id: hiveId, user_id: companyId })
      .executeTakeFirstOrThrow();
    feedId = Number(feed.insertId);
    const harvest = await db
      .insertInto('harvests')
      .values({ date: taskDate, hive_id: hiveId, user_id: companyId })
      .executeTakeFirstOrThrow();
    harvestId = Number(harvest.insertId);
    const laterHarvest = await db
      .insertInto('harvests')
      .values({ date: laterDate, hive_id: hiveId, user_id: companyId })
      .executeTakeFirstOrThrow();
    laterHarvestId = Number(laterHarvest.insertId);
    const treatment = await db
      .insertInto('treatments')
      .values({ date: taskDate, hive_id: hiveId, user_id: companyId })
      .executeTakeFirstOrThrow();
    treatmentId = Number(treatment.insertId);
    const checkup = await db
      .insertInto('checkups')
      .values({ date: taskDate, hive_id: hiveId, user_id: companyId })
      .executeTakeFirstOrThrow();
    checkupId = Number(checkup.insertId);

    const waxOperation = await db
      .insertInto('wax_operations')
      .values({ date: taskDate, type: 'production', user_id: companyId })
      .executeTakeFirstOrThrow();
    waxOperationId = Number(waxOperation.insertId);
    await db
      .insertInto('wax_operation_hives')
      .values({ operation_id: waxOperationId, hive_id: hiveId })
      .execute();
  });

  afterAll(async () => {
    await db
      .deleteFrom('wax_operation_hives')
      .where('operation_id', '=', waxOperationId)
      .execute();
    await db
      .deleteFrom('wax_operations')
      .where('id', '=', waxOperationId)
      .execute();
    await db.deleteFrom('feeds').where('id', '=', feedId).execute();
    await db
      .deleteFrom('harvests')
      .where('id', 'in', [harvestId, laterHarvestId])
      .execute();
    await db.deleteFrom('treatments').where('id', '=', treatmentId).execute();
    await db.deleteFrom('checkups').where('id', '=', checkupId).execute();
    if (movementIds.length) {
      await db.deleteFrom('movedates').where('id', 'in', movementIds).execute();
    }
    await db.deleteFrom('hives').where('id', '=', hiveId).execute();
    await db
      .deleteFrom('apiaries')
      .where('id', 'in', [firstApiaryId, latestApiaryId, foreignApiaryId])
      .execute();
    await db
      .deleteFrom('companies')
      .where('id', 'in', [companyId, foreignCompanyId])
      .execute();
  });

  it('uses the latest same-day movement in all task apiary views', async () => {
    const [feeds, harvests, treatments, checkups] = await Promise.all([
      db
        .selectFrom('feeds_apiaries')
        .select(['feed_id as task_id', 'apiary_id', 'user_id'])
        .where('feed_id', '=', feedId)
        .execute(),
      db
        .selectFrom('harvests_apiaries')
        .select(['harvest_id as task_id', 'apiary_id', 'user_id'])
        .where('harvest_id', '=', harvestId)
        .execute(),
      db
        .selectFrom('treatments_apiaries')
        .select(['treatment_id as task_id', 'apiary_id', 'user_id'])
        .where('treatment_id', '=', treatmentId)
        .execute(),
      db
        .selectFrom('checkups_apiaries')
        .select(['checkup_id as task_id', 'apiary_id', 'user_id'])
        .where('checkup_id', '=', checkupId)
        .execute(),
    ]);

    expect(feeds).toEqual([
      { task_id: feedId, apiary_id: latestApiaryId, user_id: companyId },
    ]);
    expect(harvests).toEqual([
      { task_id: harvestId, apiary_id: latestApiaryId, user_id: companyId },
    ]);
    expect(treatments).toEqual([
      { task_id: treatmentId, apiary_id: latestApiaryId, user_id: companyId },
    ]);
    expect(checkups).toEqual([
      { task_id: checkupId, apiary_id: latestApiaryId, user_id: companyId },
    ]);
  });

  it('ignores cross-company movements', async () => {
    const locations = await db
      .selectFrom('harvests_apiaries')
      .select(['apiary_id', 'user_id'])
      .where('harvest_id', '=', laterHarvestId)
      .execute();

    expect(locations).toEqual([
      { apiary_id: latestApiaryId, user_id: companyId },
    ]);
  });

  it('uses one historical apiary lookup for wax operation hives', async () => {
    const result = await listWaxOperations(db, companyId, {
      limit: 10,
      offset: 0,
    });
    const operation = result.results.find((row) => row.id === waxOperationId);

    expect(operation?.hives).toEqual([
      expect.objectContaining({
        id: hiveId,
        apiary_id: latestApiaryId,
        apiary_name: 'Latest historical apiary',
      }),
    ]);
  });
});
