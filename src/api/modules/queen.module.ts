import httpErrors from 'http-errors';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { Database } from '../../types/database.types.js';
import type { DB } from '../../types/db.types.js';
import type { CompatibilityQuery } from '../schemas/common.schema.js';
import type { PatchBody, PostBody } from '../schemas/queen.schema.js';
import { actorProjection } from './actor_projection.module.js';

const orderFields = {
  id: 'queens.id',
  name: 'queens.name',
  date: 'queens.date',
  move_date: 'queens.move_date',
  modus: 'queens.modus',
  created_at: 'queens.created_at',
  updated_at: 'queens.updated_at',
  'queens.id': 'queens.id',
  'queens.name': 'queens.name',
  'queens.date': 'queens.date',
  'hive_location.hive_name': 'hives_locations.hive_name',
} as const;
function direction(value: unknown): 'asc' | 'desc' {
  return String(value).toLowerCase() === 'desc' ? 'desc' : 'asc';
}
function applyOrder<Q>(query: Q, order: unknown, directions: unknown): Q {
  const fields = Array.isArray(order) ? order : order ? [order] : [];
  const dirs = Array.isArray(directions) ? directions : [directions];
  let result = query;
  fields.forEach((field, index) => {
    const column = orderFields[String(field) as keyof typeof orderFields];
    if (column)
      result = (
        result as Q & {
          orderBy: (field: string, direction: 'asc' | 'desc') => Q;
        }
      ).orderBy(column, direction(dirs[index]));
  });
  return result;
}
function hiveLocationProjection() {
  return sql<Record<
    string,
    unknown
  > | null>`CASE WHEN hives_locations.hive_id IS NULL THEN NULL ELSE JSON_OBJECT('hive_id', hives_locations.hive_id, 'hive_name', hives_locations.hive_name, 'apiary_id', hives_locations.apiary_id, 'apiary_name', hives_locations.apiary_name, 'hive_modus', IF(hives_locations.hive_modus = 1, TRUE, FALSE), 'hive_deleted', IF(hives_locations.hive_deleted = 1, TRUE, FALSE), 'user_id', hives_locations.user_id) END`.as(
    'hive_location',
  );
}
function optionProjection(
  table: 'queen_races' | 'queen_matings',
  alias: 'race' | 'mating',
) {
  return sql<Record<
    string,
    unknown
  > | null>`CASE WHEN ${sql.table(table)}.id IS NULL THEN NULL ELSE JSON_OBJECT('id', ${sql.ref(`${table}.id`)}, 'name', ${sql.ref(`${table}.name`)}, 'modus', IF(${sql.ref(`${table}.modus`)} = 1, TRUE, FALSE), 'favorite', IF(${sql.ref(`${table}.favorite`)} = 1, TRUE, FALSE), 'user_id', ${sql.ref(`${table}.user_id`)}) END`.as(
    alias,
  );
}
function selectQueens(db: Database, companyId: number, details: boolean) {
  let query = db
    .selectFrom('queens')
    .leftJoin('hives_locations', 'hives_locations.hive_id', 'queens.hive_id')
    .selectAll('queens')
    .select(hiveLocationProjection())
    .where('queens.user_id', '=', companyId);
  if (details)
    query = query
      .leftJoin('queens_locations', 'queens_locations.queen_id', 'queens.id')
      .leftJoin('queen_races', 'queen_races.id', 'queens.race_id')
      .leftJoin('queen_matings', 'queen_matings.id', 'queens.mating_id')
      .leftJoin('queens as own_mother', 'own_mother.id', 'queens.mother_id')
      .leftJoin('bees as creator', 'creator.id', 'queens.bee_id')
      .leftJoin('bees as editor', 'editor.id', 'queens.edit_id')
      .select([
        sql<Record<
          string,
          unknown
        > | null>`CASE WHEN queens_locations.queen_id IS NULL THEN NULL ELSE JSON_OBJECT('queen_id', queens_locations.queen_id, 'hive_id', queens_locations.hive_id, 'hive_name', queens_locations.hive_name, 'queen_name', queens_locations.queen_name, 'queen_mark_colour', queens_locations.queen_mark_colour, 'queen_modus', IF(queens_locations.queen_modus = 1, TRUE, FALSE), 'queen_modus_date', queens_locations.queen_modus_date, 'queen_move_date', queens_locations.queen_move_date) END`.as(
          'queen_location',
        ),
        optionProjection('queen_races', 'race'),
        optionProjection('queen_matings', 'mating'),
        sql<Record<
          string,
          unknown
        > | null>`CASE WHEN own_mother.id IS NULL THEN NULL ELSE JSON_OBJECT('id', own_mother.id, 'name', own_mother.name, 'date', own_mother.date, 'mother', own_mother.mother, 'mark_colour', own_mother.mark_colour) END`.as(
          'own_mother',
        ),
        actorProjection('creator'),
        actorProjection('editor'),
      ]);
  return query;
}
export async function listQueens(
  db: Database,
  companyId: number,
  input: CompatibilityQuery,
) {
  const limit = input.limit === 0 || !input.limit ? 10 : input.limit;
  const offset = input.offset ?? 0;
  const details = input.details === true;
  let query = selectQueens(db, companyId, details).where(
    'queens.deleted',
    '=',
    input.deleted === true,
  );
  let count = db
    .selectFrom('queens')
    .leftJoin('hives_locations', 'hives_locations.hive_id', 'queens.hive_id')
    .select(db.fn.countAll<number>().as('total'))
    .where('queens.user_id', '=', companyId)
    .where('queens.deleted', '=', input.deleted === true);
  if (input.modus !== undefined && input.modus !== null) {
    query = query.where('queens.modus', '=', input.modus);
    count = count.where('modus', '=', input.modus);
  }
  if (details && input.latest !== undefined) {
    query = input.latest
      ? query.where(sql<boolean>`queens_locations.queen_id IS NOT NULL`)
      : query.where(sql<boolean>`queens_locations.queen_id IS NULL`);
  }
  if (input.filters) {
    try {
      const filters: unknown = JSON.parse(input.filters);
      if (Array.isArray(filters)) {
        for (const filter of filters) {
          if (typeof filter !== 'object' || filter === null) continue;
          const value = filter as Record<string, unknown>;
          const date = value['queens.date'];
          if (typeof date === 'object' && date !== null) {
            const range = date as Record<string, string>;
            query = query
              .where('queens.date', '>=', new Date(range.from))
              .where('queens.date', '<=', new Date(range.to));
            count = count
              .where('queens.date', '>=', new Date(range.from))
              .where('queens.date', '<=', new Date(range.to));
          }
          const matingId = Number(value['queens.mating_id']);
          if (Number.isFinite(matingId)) {
            query = query.where('queens.mating_id', '=', matingId);
            count = count.where('queens.mating_id', '=', matingId);
          }
          const raceId = Number(value['queens.race_id']);
          if (Number.isFinite(raceId)) {
            query = query.where('queens.race_id', '=', raceId);
            count = count.where('queens.race_id', '=', raceId);
          }
          const apiaryId = Number(value['hive_location.apiary_id']);
          if (Number.isFinite(apiaryId)) {
            query = query.where('hives_locations.apiary_id', '=', apiaryId);
            count = count.where('hives_locations.apiary_id', '=', apiaryId);
          }
          const hive = value['queens.hive_id'];
          if (hive === 'empty') {
            query = query.where('hives_locations.hive_id', 'is', null);
            count = count.where('hives_locations.hive_id', 'is', null);
          } else if (Number.isFinite(Number(hive))) {
            query = query.where('queens.hive_id', '=', Number(hive));
            count = count.where('queens.hive_id', '=', Number(hive));
          }
        }
      }
    } catch {
      /* preserve ignored malformed filters */
    }
  }
  if (input.q?.trim()) {
    const search = `%${input.q}%`;
    query = query.where((eb) =>
      eb.or([
        eb('queens.name', 'like', search),
        eb('hives_locations.hive_name', 'like', search),
      ]),
    );
    count = count
      .leftJoin('hives_locations', 'hives_locations.hive_id', 'queens.hive_id')
      .where((eb) =>
        eb.or([
          eb('queens.name', 'like', search),
          eb('hives_locations.hive_name', 'like', search),
        ]),
      );
  }
  query = applyOrder(query, input.order, input.direction).orderBy('queens.id');
  const [results, total] = await Promise.all([
    query
      .limit(limit)
      .offset(offset * limit)
      .execute(),
    count.executeTakeFirstOrThrow(),
  ]);
  return { results, total: total.total };
}
export async function getQueenPedigree(
  db: Database,
  companyId: number,
  id: number,
) {
  const result = await sql<{
    id: number;
    name: string | null;
    mother_id: number | null;
    date: Date | null;
    mark_colour: string | null;
    mother: string | null;
    mating: string | null;
    race: string | null;
  }>`WITH RECURSIVE mothers AS (
    SELECT q.name,q.id,q.mother_id,q.date,q.mark_colour,q.mother,qm.name mating,qr.name race FROM queens q LEFT JOIN queen_matings qm ON q.mating_id=qm.id LEFT JOIN queen_races qr ON q.race_id=qr.id WHERE q.user_id=${companyId} AND q.id=${id}
    UNION ALL SELECT q.name,q.id,q.mother_id,q.date,q.mark_colour,q.mother,qm.name mating,qr.name race FROM queens q LEFT JOIN queen_matings qm ON q.mating_id=qm.id LEFT JOIN queen_races qr ON q.race_id=qr.id INNER JOIN mothers m ON q.id=m.mother_id WHERE q.user_id=${companyId}
  ) SELECT * FROM mothers`.execute(db);
  return result.rows;
}
export async function listQueenStats(
  db: Database,
  companyId: number,
  input: CompatibilityQuery,
) {
  const limit = input.limit === 0 || !input.limit ? 10 : input.limit;
  const offset = input.offset ?? 0;
  let query = db
    .selectFrom('queen_durations')
    .innerJoin('queens', 'queens.id', 'queen_durations.id')
    .leftJoin(
      'hives_locations',
      'hives_locations.hive_id',
      'queen_durations.hive_id',
    )
    .selectAll('queen_durations')
    .select([
      sql<
        Record<string, unknown>
      >`JSON_OBJECT('id', queens.id, 'name', queens.name, 'date', queens.date, 'move_date', queens.move_date, 'hive_id', queens.hive_id)`.as(
        'queen',
      ),
      hiveLocationProjection(),
    ])
    .where('queen_durations.user_id', '=', companyId);
  let count = db
    .selectFrom('queen_durations')
    .innerJoin('queens', 'queens.id', 'queen_durations.id')
    .leftJoin(
      'hives_locations',
      'hives_locations.hive_id',
      'queen_durations.hive_id',
    )
    .select(db.fn.countAll<number>().as('total'))
    .where('queen_durations.user_id', '=', companyId);
  if (input.filters) {
    try {
      const filters: unknown = JSON.parse(input.filters);
      if (Array.isArray(filters)) {
        for (const filter of filters) {
          if (typeof filter !== 'object' || filter === null) continue;
          const value = filter as Record<string, unknown>;
          const moveDate = value['queens.move_date'];
          if (typeof moveDate === 'object' && moveDate !== null) {
            const range = moveDate as Record<string, string>;
            query = query
              .where('queen_durations.move_date', '>=', new Date(range.from))
              .where('queen_durations.move_date', '<=', new Date(range.to));
            count = count
              .where('queen_durations.move_date', '>=', new Date(range.from))
              .where('queen_durations.move_date', '<=', new Date(range.to));
          }
          const matingId = Number(value['queens.mating_id']);
          if (Number.isFinite(matingId)) {
            query = query.where('queens.mating_id', '=', matingId);
            count = count.where('queens.mating_id', '=', matingId);
          }
          const raceId = Number(value['queens.race_id']);
          if (Number.isFinite(raceId)) {
            query = query.where('queens.race_id', '=', raceId);
            count = count.where('queens.race_id', '=', raceId);
          }
          const apiaryId = Number(value['hive_location.apiary_id']);
          if (Number.isFinite(apiaryId)) {
            query = query.where('hives_locations.apiary_id', '=', apiaryId);
            count = count.where('hives_locations.apiary_id', '=', apiaryId);
          }
          const hive = value['queens.hive_id'];
          if (hive === 'empty') {
            query = query.where('hives_locations.hive_id', 'is', null);
            count = count.where('hives_locations.hive_id', 'is', null);
          } else if (Number.isFinite(Number(hive))) {
            query = query.where('queen_durations.hive_id', '=', Number(hive));
            count = count.where('queen_durations.hive_id', '=', Number(hive));
          }
        }
      }
    } catch {
      /* preserve ignored malformed filters */
    }
  }
  if (input.q?.trim()) {
    const search = `%${input.q}%`;
    query = query.where((eb) =>
      eb.or([
        eb('queens.name', 'like', search),
        eb('hives_locations.hive_name', 'like', search),
      ]),
    );
    count = count.where((eb) =>
      eb.or([
        eb('queens.name', 'like', search),
        eb('hives_locations.hive_name', 'like', search),
      ]),
    );
  }
  query = applyOrder(query, input.order, input.direction);
  const [rows, total] = await Promise.all([
    query
      .orderBy('queen_durations.id')
      .limit(limit)
      .offset(offset * limit)
      .execute(),
    count.executeTakeFirstOrThrow(),
  ]);
  const results = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      checkup: await db
        .selectFrom('checkups')
        .select([
          sql<string | null>`AVG(NULLIF(brood,0))`.as('brood'),
          sql<string | null>`AVG(NULLIF(pollen,0))`.as('pollen'),
          sql<string | null>`AVG(NULLIF(comb,0))`.as('comb'),
          sql<string | null>`AVG(NULLIF(temper,0))`.as('temper'),
          sql<string | null>`AVG(NULLIF(calm_comb,0))`.as('calm_comb'),
          sql<string | null>`AVG(NULLIF(swarm,0))`.as('swarm'),
          sql<string | null>`AVG(NULLIF(varroa,0))`.as('varroa'),
          sql<string | null>`AVG(NULLIF(strong,0))`.as('strong'),
        ])
        .where('hive_id', '=', row.hive_id)
        .where('date', '>=', row.move_date ?? new Date(0))
        .where('date', '<=', row.last_date)
        .executeTakeFirst(),
      harvest: await db
        .selectFrom('harvests')
        .select([
          db.fn.sum('frames').as('frames'),
          db.fn.sum('amount').as('amount'),
        ])
        .where('hive_id', '=', row.hive_id)
        .where('date', '>=', row.move_date ?? new Date(0))
        .where('date', '<=', row.last_date)
        .executeTakeFirst(),
    })),
  );
  return { results, total: total.total };
}
async function requireOwned(
  db: Database,
  table: 'hives' | 'queen_races' | 'queen_matings' | 'queens',
  id: number,
  companyId: number,
) {
  const row = await db
    .selectFrom(table)
    .select('id')
    .where('id', '=', id)
    .where('user_id', '=', companyId)
    .executeTakeFirst();
  if (!row) throw httpErrors.NotFound();
}
async function inactivateOtherQueens(
  db: Database,
  hiveId: number,
  moveDate: string,
) {
  let last = new Date(moveDate);
  const rows = await db
    .selectFrom('queens')
    .select(['id', 'move_date', 'modus'])
    .where('hive_id', '=', hiveId)
    .orderBy('move_date', 'desc')
    .execute();
  for (const row of rows) {
    if (!row.move_date) continue;
    const current = new Date(row.move_date);
    if (row.modus && current < last)
      await db
        .updateTable('queens')
        .set({ modus: false, modus_date: last })
        .where('id', '=', row.id)
        .execute();
    if (current < last) last = current;
  }
}
function queenValues(data: PatchBody['data']) {
  return {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.mark_colour !== undefined && { mark_colour: data.mark_colour }),
    ...(data.mother !== undefined && { mother: data.mother }),
    ...(data.date !== undefined && {
      date: data.date ? new Date(data.date) : null,
    }),
    ...(data.move_date !== undefined && {
      move_date: data.move_date ? new Date(data.move_date) : null,
    }),
    ...(data.url !== undefined && { url: data.url }),
    ...(data.note !== undefined && { note: data.note }),
    ...(data.modus !== undefined && { modus: data.modus }),
    ...(data.modus_date !== undefined && {
      modus_date: data.modus_date ? new Date(data.modus_date) : null,
    }),
    ...(data.hive_id !== undefined && {
      hive_id: data.hive_id === 'empty' ? null : data.hive_id,
    }),
    ...(data.race_id !== undefined && { race_id: data.race_id }),
    ...(data.mating_id !== undefined && { mating_id: data.mating_id }),
    ...(data.mother_id !== undefined && { mother_id: data.mother_id }),
  };
}
export async function createQueens(
  db: Kysely<DB>,
  companyId: number,
  beeId: number,
  body: PostBody,
) {
  return db.transaction().execute(async (trx) => {
    if (body.race_id)
      await requireOwned(trx, 'queen_races', body.race_id, companyId);
    if (body.mating_id)
      await requireOwned(trx, 'queen_matings', body.mating_id, companyId);
    if (body.mother_id)
      await requireOwned(trx, 'queens', body.mother_id, companyId);
    const repeat = body.repeat && body.repeat > 1 ? body.repeat : 1;
    const ids: number[] = [];
    for (let index = 0; index < repeat; index++) {
      const hiveId = Array.isArray(body.hive_id)
        ? (body.hive_id[index] ?? null)
        : (body.hive_id ?? null);
      if (hiveId) await requireOwned(trx, 'hives', hiveId, companyId);
      const result = await trx
        .insertInto('queens')
        .values({
          ...queenValues({ ...body, hive_id: hiveId }),
          name:
            repeat > 1 ? `${body.name}${(body.start ?? 0) + index}` : body.name,
          user_id: companyId,
          bee_id: beeId,
        })
        .executeTakeFirstOrThrow();
      ids.push(Number(result.insertId));
      if (hiveId && body.move_date)
        await inactivateOtherQueens(trx, hiveId, body.move_date);
    }
    return ids;
  });
}
export async function updateQueens(
  db: Kysely<DB>,
  companyId: number,
  beeId: number,
  body: PatchBody,
) {
  return db.transaction().execute(async (trx) => {
    const hiveId = body.data.hive_id === 'empty' ? null : body.data.hive_id;
    if (hiveId) await requireOwned(trx, 'hives', hiveId, companyId);
    const result = await trx
      .updateTable('queens')
      .set({ ...queenValues(body.data), edit_id: beeId })
      .where('user_id', '=', companyId)
      .where('id', 'in', body.ids)
      .executeTakeFirst();
    if (hiveId && body.data.move_date)
      await inactivateOtherQueens(trx, hiveId, body.data.move_date);
    return Number(result.numUpdatedRows);
  });
}
export async function updateQueenStatus(
  db: Database,
  companyId: number,
  beeId: number,
  ids: number[],
  status: boolean,
) {
  const result = await db
    .updateTable('queens')
    .set({ edit_id: beeId, modus: status, modus_date: new Date() })
    .where('user_id', '=', companyId)
    .where('id', 'in', ids)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}
export function getQueensByIds(db: Database, companyId: number, ids: number[]) {
  return db
    .selectFrom('queens')
    .selectAll()
    .where('user_id', '=', companyId)
    .where('id', 'in', ids)
    .execute();
}
export async function deleteQueens(
  db: Kysely<DB>,
  companyId: number,
  beeId: number,
  ids: number[],
  hard: boolean,
  restore: boolean,
) {
  return db.transaction().execute(async (trx) => {
    const rows = await trx
      .selectFrom('queens')
      .select(['id', 'deleted'])
      .where('user_id', '=', companyId)
      .where('id', 'in', ids)
      .execute();
    const hardIds = rows
      .filter((r) => (r.deleted || hard) && !restore)
      .map((r) => r.id);
    const softIds = rows
      .filter((r) => !hardIds.includes(r.id))
      .map((r) => r.id);
    if (hardIds.length)
      await trx.deleteFrom('queens').where('id', 'in', hardIds).execute();
    if (softIds.length)
      await trx
        .updateTable('queens')
        .set({
          deleted: !restore,
          deleted_at: sql<Date>`UTC_TIMESTAMP()`,
          edit_id: beeId,
        })
        .where('id', 'in', softIds)
        .execute();
    return rows;
  });
}
