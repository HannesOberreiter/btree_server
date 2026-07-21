import httpErrors from 'http-errors';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { Database } from '../../types/database.types.js';
import type { DB } from '../../types/db.types.js';
import type { CompatibilityQuery } from '../schemas/common.schema.js';
import type { PatchBody, PostBody } from '../schemas/movedate.schema.js';

const orderColumns = {
  id: 'movedates.id',
  date: 'movedates.date',
  created_at: 'movedates.created_at',
  updated_at: 'movedates.updated_at',
  'apiary.name': 'apiaries.name',
  'hive.name': 'hives.name',
} as const;

interface RelationResponse {
  [key: string]: unknown;
  id: number;
  name: string;
}

interface IdentifierResponse {
  [key: string]: unknown;
  email: string | null;
  username: string | null;
}

function apiaryProjection() {
  return sql<RelationResponse>`JSON_OBJECT(
    'id', apiaries.id,
    'name', apiaries.name,
    'description', apiaries.description,
    'latitude', apiaries.latitude,
    'longitude', apiaries.longitude,
    'elevation', apiaries.elevation,
    'note', apiaries.note,
    'url', apiaries.url,
    'modus', IF(apiaries.modus = 1, TRUE, FALSE),
    'deleted', IF(apiaries.deleted = 1, TRUE, FALSE),
    'deleted_at', apiaries.deleted_at,
    'user_id', apiaries.user_id,
    'bee_id', apiaries.bee_id,
    'edit_id', apiaries.edit_id,
    'created_at', apiaries.created_at,
    'updated_at', apiaries.updated_at
  )`.as('apiary');
}

function hiveProjection() {
  return sql<RelationResponse>`JSON_OBJECT(
    'id', hives.id,
    'name', hives.name,
    'grouphive', hives.grouphive,
    'position', hives.position,
    'note', hives.note,
    'modus', IF(hives.modus = 1, TRUE, FALSE),
    'modus_date', hives.modus_date,
    'deleted', IF(hives.deleted = 1, TRUE, FALSE),
    'deleted_at', hives.deleted_at,
    'user_id', hives.user_id,
    'bee_id', hives.bee_id,
    'edit_id', hives.edit_id,
    'type_id', hives.type_id,
    'source_id', hives.source_id,
    'created_at', hives.created_at,
    'updated_at', hives.updated_at
  )`.as('hive');
}

function identifierProjection(alias: 'creator' | 'editor') {
  return sql<IdentifierResponse | null>`
    CASE WHEN ${sql.ref(`${alias}.id`)} IS NOT NULL THEN JSON_OBJECT(
      'email', ${sql.ref(`${alias}.email`)},
      'username', ${sql.ref(`${alias}.username`)}
    ) ELSE NULL END
  `.as(alias);
}

function previousApiaryProjection() {
  return sql<Record<string, unknown> | null>`
    CASE WHEN movedates_previous_apiary.current_move_id IS NOT NULL THEN JSON_OBJECT(
      'current_move_date', movedates_previous_apiary.current_move_date,
      'current_move_id', movedates_previous_apiary.current_move_id,
      'hive_id', movedates_previous_apiary.hive_id,
      'previous_apiary_id', movedates_previous_apiary.previous_apiary_id,
      'previous_apiary_name', movedates_previous_apiary.previous_apiary_name
    ) ELSE NULL END
  `.as('movedate_previous_apiary');
}

function parseFilters(value?: string | null) {
  const filters: Array<
    | { field: 'hive_id'; value: number }
    | { field: 'apiary_id'; value: number }
    | { field: 'date'; from: Date; to: Date }
  > = [];
  if (!value) return filters;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return filters;
    for (const filter of parsed) {
      if (!filter || typeof filter !== 'object') continue;
      const candidate = filter as Record<string, unknown>;
      if (Number.isFinite(Number(candidate['movedates.hive_id']))) {
        filters.push({
          field: 'hive_id',
          value: Number(candidate['movedates.hive_id']),
        });
      } else if (Number.isFinite(Number(candidate.hive_id))) {
        filters.push({ field: 'hive_id', value: Number(candidate.hive_id) });
      } else if (Number.isFinite(Number(candidate['movedates.apiary_id']))) {
        filters.push({
          field: 'apiary_id',
          value: Number(candidate['movedates.apiary_id']),
        });
      } else if (Number.isFinite(Number(candidate.apiary_id))) {
        filters.push({
          field: 'apiary_id',
          value: Number(candidate.apiary_id),
        });
      } else if (candidate.date && typeof candidate.date === 'object') {
        const date = candidate.date as Record<string, unknown>;
        if (typeof date.from === 'string' && typeof date.to === 'string') {
          filters.push({
            field: 'date',
            from: new Date(date.from),
            to: new Date(date.to),
          });
        }
      }
    }
  } catch {
    return filters;
  }
  return filters;
}

export async function listMovedates(
  db: Database,
  companyId: number,
  input: CompatibilityQuery,
) {
  let base = db
    .selectFrom('movedates')
    .innerJoin('apiaries', 'apiaries.id', 'movedates.apiary_id')
    .innerJoin('hives', 'hives.id', 'movedates.hive_id')
    .leftJoin('bees as creator', 'creator.id', 'movedates.bee_id')
    .leftJoin('bees as editor', 'editor.id', 'movedates.edit_id')
    .leftJoin(
      'movedates_previous_apiary',
      'movedates_previous_apiary.current_move_id',
      'movedates.id',
    )
    .where('apiaries.user_id', '=', companyId);
  for (const filter of parseFilters(input.filters)) {
    if (filter.field === 'hive_id') {
      base = base.where('movedates.hive_id', '=', filter.value);
    } else if (filter.field === 'apiary_id') {
      base = base.where('movedates.apiary_id', '=', filter.value);
    } else {
      base = base
        .where('movedates.date', '>=', filter.from)
        .where('movedates.date', '<=', filter.to);
    }
  }
  const search = input.q?.trim() ?? '';
  if (search) {
    base = base.where((expression) =>
      expression.or([
        expression('hives.name', 'like', `%${search}%`),
        expression('apiaries.name', 'like', `%${search}%`),
      ]),
    );
  }
  const count = await base
    .select(sql<number | string>`COUNT(movedates.id)`.as('count'))
    .executeTakeFirstOrThrow();
  let query = base.select([
    'movedates.id',
    'movedates.date',
    'movedates.apiary_id',
    'movedates.hive_id',
    'movedates.bee_id',
    'movedates.edit_id',
    'movedates.created_at',
    'movedates.updated_at',
    apiaryProjection(),
    hiveProjection(),
    identifierProjection('creator'),
    identifierProjection('editor'),
    previousApiaryProjection(),
  ]);
  if (input.order) {
    const fields = Array.isArray(input.order) ? input.order : [input.order];
    fields.forEach((field, index) => {
      if (!(field in orderColumns)) return;
      const direction = Array.isArray(input.direction)
        ? input.direction[index]
        : input.direction;
      query = query.orderBy(
        orderColumns[field as keyof typeof orderColumns],
        direction === 'desc' ? 'desc' : 'asc',
      );
    });
  }
  const page = input.offset ?? 0;
  const limit =
    input.limit === 0 || input.limit === undefined ? 10 : input.limit;
  const results = await query
    .orderBy('movedates.id', 'asc')
    .limit(limit)
    .offset(page * limit)
    .execute();
  return { results, total: Number(count.count) };
}

async function requireOwnedApiary(
  db: Database,
  companyId: number,
  apiaryId: number,
) {
  const apiary = await db
    .selectFrom('apiaries')
    .select('id')
    .where('id', '=', apiaryId)
    .where('user_id', '=', companyId)
    .executeTakeFirst();
  if (!apiary) throw httpErrors.NotFound();
}

async function requireOwnedHive(
  db: Database,
  companyId: number,
  hiveId: number,
) {
  const hive = await db
    .selectFrom('hives')
    .select('id')
    .where('id', '=', hiveId)
    .where('user_id', '=', companyId)
    .executeTakeFirst();
  if (!hive) throw httpErrors.NotFound();
}

export function createMovedates(
  db: Kysely<DB>,
  companyId: number,
  beeId: number,
  body: PostBody,
) {
  return db.transaction().execute(async (transaction) => {
    await requireOwnedApiary(transaction, companyId, body.apiary_id);
    const ids: number[] = [];
    for (const hiveId of body.hive_ids) {
      const hive = await transaction
        .selectFrom('hives_locations')
        .select('hive_id')
        .where('user_id', '=', companyId)
        .where('hive_id', '=', hiveId)
        .executeTakeFirst();
      if (!hive) throw httpErrors.NotFound();
      const result = await transaction
        .insertInto('movedates')
        .values({
          apiary_id: body.apiary_id,
          hive_id: hiveId,
          date: new Date(body.date),
          bee_id: beeId,
        })
        .executeTakeFirstOrThrow();
      ids.push(Number(result.insertId));
    }
    return ids;
  });
}

export function updateMovedates(
  db: Kysely<DB>,
  companyId: number,
  beeId: number,
  body: PatchBody,
) {
  return db.transaction().execute(async (transaction) => {
    if (body.data.apiary_id !== undefined) {
      await requireOwnedApiary(transaction, companyId, body.data.apiary_id);
    }
    if (body.data.hive_id !== undefined) {
      await requireOwnedHive(transaction, companyId, body.data.hive_id);
    }
    const result = await transaction
      .updateTable('movedates')
      .set({
        edit_id: beeId,
        ...(body.data.apiary_id !== undefined && {
          apiary_id: body.data.apiary_id,
        }),
        ...(body.data.hive_id !== undefined && { hive_id: body.data.hive_id }),
        ...(body.data.date !== undefined && { date: new Date(body.data.date) }),
      })
      .where('id', 'in', body.ids)
      .where('apiary_id', 'in', (query) =>
        query
          .selectFrom('apiaries')
          .select('id')
          .where('user_id', '=', companyId),
      )
      .executeTakeFirst();
    return Number(result.numUpdatedRows);
  });
}

export async function updateMovedateDates(
  db: Database,
  companyId: number,
  beeId: number,
  ids: number[],
  start: string,
) {
  const result = await db
    .updateTable('movedates')
    .set({ edit_id: beeId, date: new Date(start) })
    .where('id', 'in', ids)
    .where('apiary_id', 'in', (query) =>
      query
        .selectFrom('apiaries')
        .select('id')
        .where('user_id', '=', companyId),
    )
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}

export function getMovedatesByIds(
  db: Database,
  companyId: number,
  ids: number[],
) {
  return db
    .selectFrom('movedates')
    .innerJoin('apiaries', 'apiaries.id', 'movedates.apiary_id')
    .innerJoin('hives', 'hives.id', 'movedates.hive_id')
    .select([
      'movedates.id',
      'movedates.date',
      'movedates.apiary_id',
      'movedates.hive_id',
      'movedates.bee_id',
      'movedates.edit_id',
      'movedates.created_at',
      'movedates.updated_at',
      apiaryProjection(),
      hiveProjection(),
    ])
    .where('movedates.id', 'in', ids)
    .where('apiaries.user_id', '=', companyId)
    .execute();
}

export function deleteMovedates(
  db: Kysely<DB>,
  companyId: number,
  ids: number[],
) {
  return db.transaction().execute(async (transaction) => {
    const eligible = await transaction
      .selectFrom('movedates')
      .innerJoin('apiaries', 'apiaries.id', 'movedates.apiary_id')
      .innerJoin(
        'movedates_counts',
        'movedates_counts.hive_id',
        'movedates.hive_id',
      )
      .select('movedates.id')
      .where('movedates.id', 'in', ids)
      .where('apiaries.user_id', '=', companyId)
      .where('movedates_counts.count', '>', 1)
      .execute();
    if (eligible.length === 0) throw httpErrors.Forbidden('lastMovement');
    const result = await transaction
      .deleteFrom('movedates')
      .where(
        'id',
        'in',
        eligible.map((row) => row.id),
      )
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  });
}
