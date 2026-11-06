import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { KyselyServer } from '../../src/servers/kysely.server.js';

let attackerCompanyId = 0;
let victimCompanyId = 0;
let apiaryId = 0;
let ownedHiveId = 0;
let victimHiveId = 0;
let ownedMovedateId = 0;
let crossTenantMovedateId = 0;

describe('hives_locations ownership', () => {
  const db = KyselyServer.getInstance().db;

  beforeAll(async () => {
    const attackerCompany = await db
      .insertInto('companies')
      .values({ name: `Location owner ${Date.now()}` })
      .executeTakeFirstOrThrow();
    attackerCompanyId = Number(attackerCompany.insertId);

    const victimCompany = await db
      .insertInto('companies')
      .values({ name: `Location victim ${Date.now()}` })
      .executeTakeFirstOrThrow();
    victimCompanyId = Number(victimCompany.insertId);

    const apiary = await db
      .insertInto('apiaries')
      .values({
        name: 'Location ownership apiary',
        latitude: 0,
        longitude: 0,
        user_id: attackerCompanyId,
      })
      .executeTakeFirstOrThrow();
    apiaryId = Number(apiary.insertId);

    const ownedHive = await db
      .insertInto('hives')
      .values({ name: 'Owned location hive', user_id: attackerCompanyId })
      .executeTakeFirstOrThrow();
    ownedHiveId = Number(ownedHive.insertId);

    const victimHive = await db
      .insertInto('hives')
      .values({ name: 'Victim location hive', user_id: victimCompanyId })
      .executeTakeFirstOrThrow();
    victimHiveId = Number(victimHive.insertId);

    const ownedMovedate = await db
      .insertInto('movedates')
      .values({
        apiary_id: apiaryId,
        hive_id: ownedHiveId,
        date: new Date(),
      })
      .executeTakeFirstOrThrow();
    ownedMovedateId = Number(ownedMovedate.insertId);

    const crossTenantMovedate = await db
      .insertInto('movedates')
      .values({
        apiary_id: apiaryId,
        hive_id: victimHiveId,
        date: new Date(),
      })
      .executeTakeFirstOrThrow();
    crossTenantMovedateId = Number(crossTenantMovedate.insertId);
  });

  afterAll(async () => {
    await db
      .deleteFrom('movedates')
      .where('id', 'in', [ownedMovedateId, crossTenantMovedateId])
      .execute();
    await db
      .deleteFrom('hives')
      .where('id', 'in', [ownedHiveId, victimHiveId])
      .execute();
    await db.deleteFrom('apiaries').where('id', '=', apiaryId).execute();
    await db
      .deleteFrom('companies')
      .where('id', 'in', [attackerCompanyId, victimCompanyId])
      .execute();
  });

  it('excludes cross-company hive and apiary pairs', async () => {
    const locations = await db
      .selectFrom('hives_locations')
      .select(['move_id', 'hive_id'])
      .where('move_id', 'in', [ownedMovedateId, crossTenantMovedateId])
      .execute();

    expect(locations).toContainEqual({
      move_id: ownedMovedateId,
      hive_id: ownedHiveId,
    });
    expect(locations).not.toContainEqual({
      move_id: crossTenantMovedateId,
      hive_id: victimHiveId,
    });
  });
});
