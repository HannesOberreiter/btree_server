import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createApiary,
  deleteApiaries,
} from '../../src/api/modules/apiary.module.js';
import {
  createCheckups,
  listCheckups,
} from '../../src/api/modules/checkup.module.js';
import { createFeeds, listFeeds } from '../../src/api/modules/feed.module.js';
import {
  createHarvests,
  listHarvests,
} from '../../src/api/modules/harvest.module.js';
import { createHives, deleteHives } from '../../src/api/modules/hive.module.js';
import {
  deleteTasks,
  updateTaskStatus,
} from '../../src/api/modules/task.module.js';
import {
  createTreatments,
  listTreatments,
} from '../../src/api/modules/treatment.module.js';
import { KyselyServer } from '../../src/servers/kysely.server.js';
import { createAuthenticatedAgent } from '../utils.js';

const actor = { companyId: 1, beeId: 1, isLlm: false };
const ids: Record<'feeds' | 'harvests' | 'treatments' | 'checkups', number> = {
  feeds: 0,
  harvests: 0,
  treatments: 0,
  checkups: 0,
};
const date = new Date().toISOString().slice(0, 10);
let hiveId = 0;
let apiaryId = 0;

describe('task Kysely operations', () => {
  const db = KyselyServer.getInstance().db;

  beforeAll(async () => {
    await createAuthenticatedAgent();
    const apiary = await createApiary(db, 1, 1, {
      name: `Task operations ${Date.now()}`,
    });
    apiaryId = apiary.id;
    hiveId = (
      await createHives(db, 1, 1, {
        name: `Task hive ${Date.now()}`,
        apiary_id: apiaryId,
        date,
        start: 0,
        repeat: 1,
        grouphive: 0,
        position: 0,
      })
    )[0];
    ids.feeds = (
      await createFeeds(db, actor, {
        hive_ids: [hiveId],
        date,
        amount: 2.5,
        interval: 0,
        repeat: 0,
      })
    )[0];
    ids.harvests = (
      await createHarvests(db, actor, {
        hive_ids: [hiveId],
        date,
        amount: 3.5,
        frames: 2,
        water: 18.2,
        interval: 0,
        repeat: 0,
      })
    )[0];
    ids.treatments = (
      await createTreatments(db, actor, {
        hive_ids: [hiveId],
        date,
        amount: 1.5,
        temperature: 20,
        interval: 0,
        repeat: 0,
      })
    )[0];
    ids.checkups = (
      await createCheckups(db, actor, {
        hive_ids: [hiveId],
        date,
        brood: 3.5,
        queen: true,
        temperature: 21,
        interval: 0,
        repeat: 0,
      })
    )[0];
  });

  afterAll(async () => {
    for (const [table, id] of Object.entries(ids)) {
      await deleteTasks(db, table as keyof typeof ids, actor, [id], {
        hard: true,
        restore: false,
      });
    }
    await deleteHives(db, 1, 1, [hiveId], { hard: true, restore: false });
    await deleteApiaries(db, 1, 1, [apiaryId], {
      hard: true,
      restore: false,
    });
  });

  it('preserves nested task response shapes', async () => {
    const filters = (id: number) =>
      JSON.stringify([{ hive_id: hiveId }, { id }]);
    const [feed, harvest, treatment, checkup] = await Promise.all([
      listFeeds(db, 1, {
        filters: filters(ids.feeds),
        deleted: false,
        limit: 100_000,
      }),
      listHarvests(db, 1, {
        filters: filters(ids.harvests),
        deleted: false,
        limit: 100_000,
      }),
      listTreatments(db, 1, {
        filters: filters(ids.treatments),
        deleted: false,
        limit: 100_000,
      }),
      listCheckups(db, 1, {
        filters: filters(ids.checkups),
        deleted: false,
        limit: 100_000,
      }),
    ]);

    expect(feed.results.find((row) => row.id === ids.feeds)).toEqual(
      expect.objectContaining({
        amount: 2.5,
        hive: expect.objectContaining({
          id: hiveId,
          name: expect.any(String),
        }),
        feed_apiary: expect.objectContaining({ apiary_id: expect.any(Number) }),
      }),
    );
    expect(harvest.results.find((row) => row.id === ids.harvests)).toEqual(
      expect.objectContaining({ amount: 3.5, frames: 2, water: 18.2 }),
    );
    expect(treatment.results.find((row) => row.id === ids.treatments)).toEqual(
      expect.objectContaining({ amount: 1.5, temperature: 20 }),
    );
    expect(checkup.results.find((row) => row.id === ids.checkups)).toEqual(
      expect.objectContaining({ brood: 3.5, queen: true, temperature: 21 }),
    );
  });

  it('enforces company isolation for every task table', async () => {
    expect(await listFeeds(db, 999_999, { deleted: false })).toEqual({
      results: [],
      total: 0,
    });
    expect(await listHarvests(db, 999_999, { deleted: false })).toEqual({
      results: [],
      total: 0,
    });
    expect(await listTreatments(db, 999_999, { deleted: false })).toEqual({
      results: [],
      total: 0,
    });
    expect(await listCheckups(db, 999_999, { deleted: false })).toEqual({
      results: [],
      total: 0,
    });

    for (const [table, id] of Object.entries(ids)) {
      expect(
        await updateTaskStatus(
          db,
          table as keyof typeof ids,
          { companyId: 999_999, beeId: 1, isLlm: false },
          [id],
          true,
        ),
      ).toBe(0);
    }
  });
});
