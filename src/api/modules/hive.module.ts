import dayjs from 'dayjs';
import httpErrors from 'http-errors';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { Database } from '../../types/database.types.js';
import type { DB } from '../../types/db.types.js';
import type {
  HiveCreateBody,
  HiveListQuery,
  HivePatchBody,
  HivePositionBody,
} from '../schemas/hive.schema.js';
import { actorProjection } from './actor_projection.module.js';
import { listCheckups } from './checkup.module.js';
import { listFeeds } from './feed.module.js';
import { listHarvests } from './harvest.module.js';
import { listMovedates } from './movedate.module.js';
import { limitHive } from './premium.module.js';
import { listTodos } from './todo.module.js';
import { listTreatments } from './treatment.module.js';

interface MovedateResponse {
  [key: string]: unknown;
  id: number;
  date: Date | null;
  apiary_id: number | null;
  hive_id: number | null;
  bee_id: number | null;
  edit_id: number | null;
  created_at: Date | null;
  updated_at: Date | null;
}

interface HiveLocationResponse {
  [key: string]: unknown;
  apiary_id: number;
  apiary_name: string | null;
  user_id: number | null;
  move_id: number;
  hive_id: number;
  hive_name: string | null;
  hive_modus: boolean | null;
  hive_deleted: boolean | null;
  movedate: MovedateResponse | null;
}

interface OptionResponse {
  [key: string]: unknown;
  id: number;
  name: string | null;
  favorite: boolean | null;
  modus: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
  user_id: number | null;
}

interface QueenResponse {
  [key: string]: unknown;
  id: number;
  name: string;
}

interface QueenLocationResponse {
  [key: string]: unknown;
  hive_id: number;
  hive_name: string | null;
  queen_id: number | null;
  queen_name: string | null;
  queen_modus: boolean | null;
  queen_modus_date: Date | null;
  queen_move_date: Date | null;
  queen_mark_colour: string | null;
  queen?: QueenResponse | null;
}

const orderColumns = {
  id: 'hives.id',
  name: 'hives.name',
  position: 'hives.position',
  grouphive: 'hives.grouphive',
  modus: 'hives.modus',
  modus_date: 'hives.modus_date',
  created_at: 'hives.created_at',
  updated_at: 'hives.updated_at',
  deleted_at: 'hives.deleted_at',
  apiary_name: 'hives_locations.apiary_name',
  'hive_location.apiary_name': 'hives_locations.apiary_name',
  'queen_location.queen_name': 'queens_locations.queen_name',
  'hive_source.name': 'hive_sources.name',
  'hive_type.name': 'hive_types.name',
} as const;

function hiveSelections() {
  return [
    'hives.id',
    sql<string>`hives.name`.as('name'),
    'hives.grouphive',
    'hives.position',
    'hives.note',
    'hives.modus',
    'hives.modus_date',
    'hives.deleted',
    'hives.deleted_at',
    'hives.created_at',
    'hives.updated_at',
    'hives.user_id',
    'hives.bee_id',
    'hives.edit_id',
    'hives.type_id',
    'hives.source_id',
  ] as const;
}

function movedateProjection() {
  return sql<MovedateResponse | null>`
    CASE WHEN movedates.id IS NOT NULL THEN JSON_OBJECT(
      'id', movedates.id,
      'date', movedates.date,
      'apiary_id', movedates.apiary_id,
      'hive_id', movedates.hive_id,
      'bee_id', movedates.bee_id,
      'edit_id', movedates.edit_id,
      'created_at', movedates.created_at,
      'updated_at', movedates.updated_at
    ) ELSE NULL END
  `;
}

function hiveLocationProjection() {
  return sql<HiveLocationResponse | null>`
    CASE WHEN hives_locations.move_id IS NOT NULL THEN JSON_OBJECT(
      'apiary_id', hives_locations.apiary_id,
      'apiary_name', hives_locations.apiary_name,
      'user_id', hives_locations.user_id,
      'move_id', hives_locations.move_id,
      'hive_id', hives_locations.hive_id,
      'hive_name', hives_locations.hive_name,
      'hive_modus', IF(hives_locations.hive_modus = 1, TRUE, FALSE),
      'hive_deleted', IF(hives_locations.hive_deleted = 1, TRUE, FALSE),
      'movedate', ${movedateProjection()}
    ) ELSE NULL END
  `.as('hive_location');
}

function optionProjection(alias: 'hive_sources' | 'hive_types', name: string) {
  return sql<OptionResponse | null>`
    CASE WHEN ${sql.ref(`${alias}.id`)} IS NOT NULL THEN JSON_OBJECT(
      'id', ${sql.ref(`${alias}.id`)},
      'name', ${sql.ref(`${alias}.name`)},
      'favorite', IF(${sql.ref(`${alias}.favorite`)} = 1, TRUE, FALSE),
      'modus', IF(${sql.ref(`${alias}.modus`)} = 1, TRUE, FALSE),
      'created_at', ${sql.ref(`${alias}.created_at`)},
      'updated_at', ${sql.ref(`${alias}.updated_at`)},
      'user_id', ${sql.ref(`${alias}.user_id`)}
    ) ELSE NULL END
  `.as(name);
}

function queenOptionProjection(alias: 'queen_races' | 'queen_matings') {
  return sql<Record<string, unknown> | null>`
    CASE WHEN ${sql.ref(`${alias}.id`)} IS NOT NULL THEN JSON_OBJECT(
      'id', ${sql.ref(`${alias}.id`)},
      'name', ${sql.ref(`${alias}.name`)},
      'favorite', IF(${sql.ref(`${alias}.favorite`)} = 1, TRUE, FALSE),
      'modus', IF(${sql.ref(`${alias}.modus`)} = 1, TRUE, FALSE),
      'created_at', ${sql.ref(`${alias}.created_at`)},
      'updated_at', ${sql.ref(`${alias}.updated_at`)},
      'user_id', ${sql.ref(`${alias}.user_id`)}
    ) ELSE NULL END
  `;
}

function queenProjection() {
  return sql<QueenResponse | null>`
    CASE WHEN queens.id IS NOT NULL THEN JSON_OBJECT(
      'id', queens.id,
      'name', queens.name,
      'date', queens.date,
      'move_date', queens.move_date,
      'mother', queens.mother,
      'mother_id', queens.mother_id,
      'mark_colour', queens.mark_colour,
      'modus', IF(queens.modus = 1, TRUE, FALSE),
      'modus_date', queens.modus_date,
      'deleted', IF(queens.deleted = 1, TRUE, FALSE),
      'deleted_at', queens.deleted_at,
      'note', queens.note,
      'url', queens.url,
      'hive_id', queens.hive_id,
      'race_id', queens.race_id,
      'mating_id', queens.mating_id,
      'user_id', queens.user_id,
      'bee_id', queens.bee_id,
      'edit_id', queens.edit_id,
      'created_at', queens.created_at,
      'updated_at', queens.updated_at,
      'race', ${queenOptionProjection('queen_races')},
      'mating', ${queenOptionProjection('queen_matings')}
    ) ELSE NULL END
  `;
}

function queenLocationProjection() {
  return sql<QueenLocationResponse | null>`
    CASE WHEN queens_locations.hive_id IS NOT NULL THEN JSON_OBJECT(
      'hive_id', queens_locations.hive_id,
      'hive_name', queens_locations.hive_name,
      'queen_id', queens_locations.queen_id,
      'queen_name', queens_locations.queen_name,
      'queen_modus', IF(queens_locations.queen_modus = 1, TRUE, FALSE),
      'queen_modus_date', queens_locations.queen_modus_date,
      'queen_move_date', queens_locations.queen_move_date,
      'queen_mark_colour', queens_locations.queen_mark_colour
    ) ELSE NULL END
  `.as('queen_location');
}

function queenLocationDetailProjection() {
  return sql<QueenLocationResponse | null>`
    CASE WHEN queens_locations.hive_id IS NOT NULL THEN JSON_OBJECT(
      'hive_id', queens_locations.hive_id,
      'hive_name', queens_locations.hive_name,
      'queen_id', queens_locations.queen_id,
      'queen_name', queens_locations.queen_name,
      'queen_modus', IF(queens_locations.queen_modus = 1, TRUE, FALSE),
      'queen_modus_date', queens_locations.queen_modus_date,
      'queen_move_date', queens_locations.queen_move_date,
      'queen_mark_colour', queens_locations.queen_mark_colour,
      'queen', ${queenProjection()}
    ) ELSE NULL END
  `.as('queen_location');
}

function parseFilters(value?: string) {
  const result: Array<{
    field: 'type_id' | 'source_id' | 'apiary_id';
    value: number;
  }> = [];
  if (!value) return result;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return result;
    for (const filter of parsed) {
      if (!filter || typeof filter !== 'object') continue;
      const candidate = filter as Record<string, unknown>;
      if (Number.isFinite(Number(candidate.type_id))) {
        result.push({ field: 'type_id', value: Number(candidate.type_id) });
      } else if (Number.isFinite(Number(candidate.source_id))) {
        result.push({ field: 'source_id', value: Number(candidate.source_id) });
      } else if (
        Number.isFinite(Number(candidate['hive_location.apiary_id']))
      ) {
        result.push({
          field: 'apiary_id',
          value: Number(candidate['hive_location.apiary_id']),
        });
      }
    }
  } catch {
    return result;
  }
  return result;
}

export async function listHives(
  db: Database,
  companyId: number,
  input: HiveListQuery,
) {
  let base = db
    .selectFrom('hives')
    .leftJoin('hives_locations', 'hives_locations.hive_id', 'hives.id')
    .leftJoin('movedates', 'movedates.id', 'hives_locations.move_id')
    .leftJoin('hive_types', 'hive_types.id', 'hives.type_id')
    .leftJoin('queens_locations', 'queens_locations.hive_id', 'hives.id')
    .leftJoin('hive_sources', 'hive_sources.id', 'hives.source_id')
    .leftJoin('bees as creator', 'creator.id', 'hives.bee_id')
    .leftJoin('bees as editor', 'editor.id', 'hives.edit_id')
    .where('hives.user_id', '=', companyId)
    .where('hives.deleted', '=', input.deleted === true);
  if (input.modus !== undefined && input.modus !== null) {
    base = base.where('hives.modus', '=', input.modus);
  }
  for (const filter of parseFilters(input.filters ?? undefined)) {
    if (filter.field === 'type_id') {
      base = base.where('hives.type_id', '=', filter.value);
    } else if (filter.field === 'source_id') {
      base = base.where('hives.source_id', '=', filter.value);
    } else {
      base = base.where('hives_locations.apiary_id', '=', filter.value);
    }
  }
  const search = input.q?.trim() ?? '';
  if (search) {
    base = base.where((expression) =>
      expression.or([
        expression('hives.name', 'like', `%${search}%`),
        expression('hives_locations.apiary_name', 'like', `%${search}%`),
      ]),
    );
  }
  const count = await base
    .select(sql<number | string>`COUNT(hives.id)`.as('count'))
    .executeTakeFirstOrThrow();
  const orderings: Array<{
    column: (typeof orderColumns)[keyof typeof orderColumns];
    direction: 'asc' | 'desc';
  }> = [];
  if (input.order) {
    const fields = Array.isArray(input.order) ? input.order : [input.order];
    fields.forEach((field, index) => {
      if (!(field in orderColumns)) return;
      const direction = Array.isArray(input.direction)
        ? input.direction[index]
        : input.direction;
      orderings.push({
        column: orderColumns[field as keyof typeof orderColumns],
        direction: direction === 'desc' ? 'desc' : 'asc',
      });
    });
  }
  const page = input.offset ?? 0;
  const limit =
    input.limit === 0 || input.limit === undefined ? 10 : input.limit;

  if (input.details === true) {
    let query = base.select([
      ...hiveSelections(),
      hiveLocationProjection(),
      queenLocationProjection(),
      optionProjection('hive_sources', 'hive_source'),
      optionProjection('hive_types', 'hive_type'),
      actorProjection('creator'),
      actorProjection('editor'),
    ]);
    for (const ordering of orderings) {
      query = query.orderBy(ordering.column, ordering.direction);
    }
    const results = await query
      .orderBy('hives.id', 'asc')
      .limit(limit)
      .offset(page * limit)
      .execute();
    return { results, total: Number(count.count) };
  }

  let query = base.select([...hiveSelections(), hiveLocationProjection()]);
  for (const ordering of orderings) {
    query = query.orderBy(ordering.column, ordering.direction);
  }
  const results = await query
    .orderBy('hives.id', 'asc')
    .limit(limit)
    .offset(page * limit)
    .execute();
  return { results, total: Number(count.count) };
}

export async function getHiveDetail(
  db: Database,
  companyId: number,
  id: number,
) {
  const hive = await db
    .selectFrom('hives')
    .leftJoin('hives_locations', 'hives_locations.hive_id', 'hives.id')
    .leftJoin('movedates', 'movedates.id', 'hives_locations.move_id')
    .leftJoin('queens_locations', 'queens_locations.hive_id', 'hives.id')
    .leftJoin('queens', 'queens.id', 'queens_locations.queen_id')
    .leftJoin('queen_races', 'queen_races.id', 'queens.race_id')
    .leftJoin('queen_matings', 'queen_matings.id', 'queens.mating_id')
    .leftJoin('hive_sources', 'hive_sources.id', 'hives.source_id')
    .leftJoin('hive_types', 'hive_types.id', 'hives.type_id')
    .leftJoin('bees as creator', 'creator.id', 'hives.bee_id')
    .leftJoin('bees as editor', 'editor.id', 'hives.edit_id')
    .select([
      ...hiveSelections(),
      hiveLocationProjection(),
      queenLocationDetailProjection(),
      optionProjection('hive_sources', 'hive_source'),
      optionProjection('hive_types', 'hive_type'),
      actorProjection('creator'),
      actorProjection('editor'),
    ])
    .where('hives.id', '=', id)
    .where('hives.user_id', '=', companyId)
    .where('hives.deleted', '=', false)
    .executeTakeFirst();
  if (!hive) throw httpErrors.NotFound();

  const [firstMovedate, sameLocation] = await Promise.all([
    db
      .selectFrom('movedates')
      .selectAll()
      .where('hive_id', '=', hive.id)
      .orderBy('date', 'desc')
      .executeTakeFirst(),
    db
      .selectFrom('hives_locations')
      .innerJoin('hives', 'hives.id', 'hives_locations.hive_id')
      .select([
        'hives.id',
        'hives.position',
        sql<string>`hives.name`.as('name'),
      ])
      .where(
        'hives_locations.apiary_id',
        '=',
        hive.hive_location?.apiary_id ?? 0,
      )
      .where('hives_locations.hive_deleted', '=', false)
      .where('hives_locations.hive_modus', '=', true)
      .orderBy('hives.position', 'asc')
      .orderBy('hives.name', 'asc')
      .execute(),
  ]);
  return { ...hive, sameLocation, firstMovedate };
}

export async function getHiveTasks(
  db: Kysely<DB>,
  actor: { companyId: number; beeId: number; isLlm: boolean },
  id: number,
  year: number,
  apiary: boolean,
) {
  let hiveIds: number[];
  if (apiary) {
    const ownedApiary = await db
      .selectFrom('apiaries')
      .select('id')
      .where('id', '=', id)
      .where('user_id', '=', actor.companyId)
      .where('deleted', '=', false)
      .executeTakeFirst();
    if (!ownedApiary) throw httpErrors.NotFound();
    const locations = await db
      .selectFrom('hives_locations')
      .select('hive_id')
      .where('apiary_id', '=', id)
      .where('hive_deleted', '=', false)
      .where('hive_modus', '=', true)
      .execute();
    hiveIds = locations.map((location) => location.hive_id);
  } else {
    const hive = await db
      .selectFrom('hives')
      .select('id')
      .where('id', '=', id)
      .where('user_id', '=', actor.companyId)
      .where('deleted', '=', false)
      .executeTakeFirst();
    if (!hive) throw httpErrors.NotFound();
    hiveIds = [hive.id];
  }

  const filters = JSON.stringify([
    { hive_id_array: hiveIds },
    { date: { from: `${year}-01-01`, to: `${year}-12-31` } },
  ]);
  const query = { filters, deleted: false, limit: 100_000, offset: 0 };
  const [harvest, feed, treatment, checkup, movedateGroups, todos] =
    await Promise.all([
      listHarvests(db, actor.companyId, query),
      listFeeds(db, actor.companyId, query),
      listTreatments(db, actor.companyId, query),
      listCheckups(db, actor.companyId, query),
      Promise.all(
        hiveIds.map((hiveId) =>
          listMovedates(db, actor.companyId, {
            filters: JSON.stringify([
              { 'movedates.hive_id': hiveId },
              { date: { from: `${year}-01-01`, to: `${year}-12-31` } },
            ]),
            limit: 100_000,
            offset: 0,
            order: 'date',
            direction: 'desc',
          }),
        ),
      ),
      apiary
        ? listTodos(db, actor, {
            apiary_id: id,
            filters: JSON.stringify([
              { date: { from: `${year}-01-01`, to: `${year}-12-31` } },
            ]),
            limit: 100_000,
            offset: 0,
          })
        : Promise.resolve({ results: [] }),
    ]);

  const withKind = <T extends object>(rows: T[], kind: string) =>
    rows.map((row) => ({ ...row, kind }));
  const byDateDescending = <T extends { date: unknown }>(rows: T[]) =>
    rows.sort(
      (left, right) =>
        new Date(String(right.date)).getTime() -
        new Date(String(left.date)).getTime(),
    );
  return {
    harvest: byDateDescending(withKind(harvest.results, 'harvest')),
    feed: byDateDescending(withKind(feed.results, 'feed')),
    treatment: byDateDescending(withKind(treatment.results, 'treatment')),
    checkup: byDateDescending(withKind(checkup.results, 'checkup')),
    movedate: byDateDescending(
      withKind(
        movedateGroups.flatMap((group) => group.results),
        'movedate',
      ),
    ),
    todo: withKind(todos.results, 'todo'),
  };
}

async function duplicateName(
  db: Database,
  companyId: number,
  name: string,
  excludeId?: number,
) {
  let query = db
    .selectFrom('hives')
    .select('id')
    .where('user_id', '=', companyId)
    .where('name', '=', name)
    .where('deleted', '=', false)
    .where('modus', '=', true);
  if (excludeId !== undefined) query = query.where('id', '!=', excludeId);
  return Boolean(await query.executeTakeFirst());
}

function hiveValues(input: HivePatchBody['data']) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.grouphive !== undefined && { grouphive: input.grouphive }),
    ...(input.position !== undefined && { position: input.position }),
    ...(input.note !== undefined && { note: input.note }),
    ...(input.modus !== undefined && { modus: input.modus }),
    ...(input.modus_date !== undefined && {
      modus_date: new Date(input.modus_date),
    }),
    ...(input.deleted !== undefined && { deleted: input.deleted }),
    ...(input.source_id !== undefined && { source_id: input.source_id }),
    ...(input.type_id !== undefined && { type_id: input.type_id }),
  };
}

export async function createHives(
  db: Kysely<DB>,
  companyId: number,
  beeId: number,
  body: HiveCreateBody,
) {
  const repeat = body.repeat > 1 ? body.repeat : 1;
  if (await limitHive(companyId, repeat, db)) {
    throw httpErrors.PaymentRequired(
      'Free plan hive limit reached — premium subscription required to create more hives',
    );
  }
  return db.transaction().execute(async (transaction) => {
    const apiary = await transaction
      .selectFrom('apiaries')
      .select('id')
      .where('id', '=', body.apiary_id)
      .where('user_id', '=', companyId)
      .executeTakeFirst();
    if (!apiary) throw httpErrors.NotFound();
    const ids: number[] = [];
    for (let index = 0; index < repeat; index++) {
      const name = repeat > 1 ? `${body.name}${body.start + index}` : body.name;
      if (await duplicateName(transaction, companyId, name)) {
        throw httpErrors.Conflict('name');
      }
      const inserted = await transaction
        .insertInto('hives')
        .values({
          ...hiveValues(body),
          name,
          bee_id: beeId,
          user_id: companyId,
        })
        .executeTakeFirstOrThrow();
      const hiveId = Number(inserted.insertId);
      await transaction
        .insertInto('movedates')
        .values({
          apiary_id: body.apiary_id,
          date: new Date(body.date),
          hive_id: hiveId,
          bee_id: beeId,
        })
        .executeTakeFirstOrThrow();
      ids.push(hiveId);
    }
    return ids;
  });
}

export function updateHives(
  db: Kysely<DB>,
  companyId: number,
  beeId: number,
  body: HivePatchBody,
) {
  return db.transaction().execute(async (transaction) => {
    if (body.data.name !== undefined) {
      if (body.ids.length > 1) throw httpErrors.Conflict('name');
      if (
        await duplicateName(transaction, companyId, body.data.name, body.ids[0])
      ) {
        throw httpErrors.Conflict('name');
      }
    }
    const result = await transaction
      .updateTable('hives')
      .set({ ...hiveValues(body.data), edit_id: beeId })
      .where('id', 'in', body.ids)
      .where('user_id', '=', companyId)
      .executeTakeFirst();
    return Number(result.numUpdatedRows);
  });
}

export async function updateHiveStatus(
  db: Database,
  companyId: number,
  beeId: number,
  ids: number[],
  status: boolean,
) {
  const result = await db
    .updateTable('hives')
    .set({
      edit_id: beeId,
      modus: status,
      modus_date: new Date(dayjs().format('YYYY-MM-DD')),
    })
    .where('id', 'in', ids)
    .where('user_id', '=', companyId)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}

export function getHivesByIds(db: Database, companyId: number, ids: number[]) {
  return db
    .selectFrom('hives')
    .select(hiveSelections())
    .where('user_id', '=', companyId)
    .where('id', 'in', ids)
    .execute();
}

export function updateHivePositions(
  db: Kysely<DB>,
  companyId: number,
  body: HivePositionBody,
) {
  return db.transaction().execute(async (transaction) => {
    const results: number[] = [];
    for (const hive of body.data) {
      const result = await transaction
        .updateTable('hives')
        .set({ position: hive.position })
        .where('id', '=', hive.id)
        .where('user_id', '=', companyId)
        .executeTakeFirst();
      results.push(Number(result.numUpdatedRows));
    }
    return results;
  });
}

async function deleteConnections(db: Database, ids: number[]) {
  await Promise.all([
    db.deleteFrom('movedates').where('hive_id', 'in', ids).execute(),
    db.deleteFrom('feeds').where('hive_id', 'in', ids).execute(),
    db.deleteFrom('treatments').where('hive_id', 'in', ids).execute(),
    db.deleteFrom('checkups').where('hive_id', 'in', ids).execute(),
    db.deleteFrom('harvests').where('hive_id', 'in', ids).execute(),
    db.deleteFrom('queens').where('hive_id', 'in', ids).execute(),
  ]);
}

export function deleteHives(
  db: Kysely<DB>,
  companyId: number,
  beeId: number,
  ids: number[],
  options: { hard: boolean; restore: boolean },
) {
  return db.transaction().execute(async (transaction) => {
    const rows = await transaction
      .selectFrom('hives')
      .select(hiveSelections())
      .where('user_id', '=', companyId)
      .where('id', 'in', ids)
      .execute();
    const softIds: number[] = [];
    const hardIds: number[] = [];
    for (const hive of rows) {
      if ((hive.deleted || options.hard) && !options.restore)
        hardIds.push(hive.id);
      else softIds.push(hive.id);
    }
    if (hardIds.length > 0) {
      await deleteConnections(transaction, hardIds);
      await transaction
        .deleteFrom('hives')
        .where('user_id', '=', companyId)
        .where('id', 'in', hardIds)
        .execute();
    }
    if (softIds.length > 0) {
      await transaction
        .updateTable('hives')
        .set({
          deleted: !options.restore,
          deleted_at: new Date(),
          edit_id: beeId,
        })
        .where('user_id', '=', companyId)
        .where('id', 'in', softIds)
        .execute();
    }
    return rows;
  });
}
