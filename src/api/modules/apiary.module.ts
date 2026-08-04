import httpErrors from 'http-errors';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { Database } from '../../types/database.types.js';
import type { DB } from '../../types/db.types.js';
import type {
  ApiaryCreateBody,
  ApiaryListQuery,
  ApiaryOrderField,
  ApiaryValues,
} from '../schemas/apiary.schema.js';
import { actorProjection } from './actor_projection.module.js';
import { limitApiary } from './premium.module.js';

interface HiveCountProjection {
  [key: string]: unknown;
  id: number;
  apiary_name: string;
  count: number;
  grouphivescount: number;
}

const orderColumns: Record<
  ApiaryOrderField,
  'apiaries.id' | 'apiaries.name' | 'apiaries.modus' | 'hives_counts.count'
> = {
  id: 'apiaries.id',
  name: 'apiaries.name',
  modus: 'apiaries.modus',
  'hive_count.count': 'hives_counts.count',
};

function apiarySelections() {
  return [
    'apiaries.id',
    sql<string>`apiaries.name`.as('name'),
    'apiaries.description',
    sql<number>`CAST(apiaries.latitude AS DOUBLE)`.as('latitude'),
    sql<number>`CAST(apiaries.longitude AS DOUBLE)`.as('longitude'),
    'apiaries.elevation',
    'apiaries.note',
    'apiaries.url',
    'apiaries.modus',
    'apiaries.deleted',
    'apiaries.deleted_at',
    'apiaries.user_id',
    'apiaries.bee_id',
    'apiaries.edit_id',
    'apiaries.created_at',
    'apiaries.updated_at',
  ] as const;
}

function hiveCountProjection() {
  return sql<HiveCountProjection | null>`
    CASE WHEN hives_counts.id IS NOT NULL THEN JSON_OBJECT(
      'id', hives_counts.id,
      'apiary_name', hives_counts.apiary_name,
      'count', hives_counts.count,
      'grouphivescount', hives_counts.grouphivescount
    ) ELSE NULL END
  `.as('hive_count');
}

function selectApiaries(db: Database) {
  return db
    .selectFrom('apiaries')
    .leftJoin('hives_counts', 'hives_counts.id', 'apiaries.id')
    .select([...apiarySelections(), hiveCountProjection()]);
}

function inputValues(input: ApiaryValues) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.description !== undefined && {
      description: input.description,
    }),
    ...(input.latitude !== undefined && { latitude: input.latitude }),
    ...(input.longitude !== undefined && { longitude: input.longitude }),
    ...(input.elevation !== undefined && { elevation: input.elevation }),
    ...(input.note !== undefined && { note: input.note }),
    ...(input.url !== undefined && { url: input.url }),
    ...(input.modus !== undefined && { modus: input.modus }),
    ...(input.deleted !== undefined && { deleted: input.deleted }),
    ...(input.deleted_at !== undefined && {
      deleted_at: input.deleted_at === null ? null : new Date(input.deleted_at),
    }),
  };
}

async function hasDuplicateName(
  db: Database,
  companyId: number,
  name: string,
  excludeId?: number,
) {
  let query = db
    .selectFrom('apiaries')
    .select('id')
    .where('user_id', '=', companyId)
    .where('name', '=', name)
    .where('deleted', '=', false)
    .where('modus', '=', true);
  if (excludeId !== undefined) query = query.where('id', '!=', excludeId);
  return Boolean(await query.executeTakeFirst());
}

export async function listApiaries(
  db: Database,
  companyId: number,
  input: ApiaryListQuery,
) {
  let base = db
    .selectFrom('apiaries')
    .leftJoin('hives_counts', 'hives_counts.id', 'apiaries.id')
    .where('apiaries.user_id', '=', companyId)
    .where('apiaries.deleted', '=', input.deleted === true);
  if (input.modus !== undefined && input.modus !== null) {
    base = base.where('apiaries.modus', '=', input.modus);
  }
  const search = input.q === undefined ? '' : String(input.q).trim();
  if (search) {
    base = base.where((expression) =>
      expression.or([
        expression('apiaries.name', 'like', `%${search}%`),
        expression('apiaries.description', 'like', `%${search}%`),
        expression('apiaries.note', 'like', `%${search}%`),
      ]),
    );
  }

  const count = await base
    .select(sql<number | string>`COUNT(apiaries.id)`.as('count'))
    .executeTakeFirstOrThrow();

  let query = base.select([...apiarySelections(), hiveCountProjection()]);
  if (input.details) {
    query = query
      .leftJoin('bees as creator', 'creator.id', 'apiaries.bee_id')
      .leftJoin('bees as editor', 'editor.id', 'apiaries.edit_id')
      .select([actorProjection('creator'), actorProjection('editor')]);
  }
  if (input.order) {
    const fields = Array.isArray(input.order) ? input.order : [input.order];
    fields.forEach((field, index) => {
      const direction = Array.isArray(input.direction)
        ? input.direction[index]
        : input.direction;
      query = query.orderBy(
        orderColumns[field],
        direction?.toLowerCase() === 'desc' ? 'desc' : 'asc',
      );
    });
  }
  const page = input.offset ?? 0;
  const limit =
    input.limit === 0 || input.limit === undefined ? 10 : input.limit;
  const results = await query
    .orderBy('apiaries.id', 'asc')
    .limit(limit)
    .offset(page * limit)
    .execute();
  return { results, total: Number(count.count) };
}

export async function getApiaryDetail(
  db: Database,
  companyId: number,
  id: number,
) {
  const apiary = await selectApiaries(db)
    .leftJoin('bees as creator', 'creator.id', 'apiaries.bee_id')
    .leftJoin('bees as editor', 'editor.id', 'apiaries.edit_id')
    .select([actorProjection('creator'), actorProjection('editor')])
    .where('apiaries.id', '=', id)
    .where('apiaries.user_id', '=', companyId)
    .where('apiaries.deleted', '=', false)
    .executeTakeFirst();
  if (!apiary) throw httpErrors.NotFound();

  const [sameLocation, firstMovedate, hives] = await Promise.all([
    db
      .selectFrom('apiaries')
      .select(['id', sql<string>`name`.as('name')])
      .where('user_id', '=', companyId)
      .where('deleted', '=', false)
      .where('modus', '=', true)
      .orderBy('name', 'asc')
      .execute(),
    db
      .selectFrom('movedates')
      .select([
        'id',
        sql<Date>`date`.as('date'),
        'apiary_id',
        'hive_id',
        'bee_id',
        'edit_id',
        'created_at',
        'updated_at',
      ])
      .where('apiary_id', '=', apiary.id)
      .orderBy('date', 'desc')
      .executeTakeFirst(),
    db
      .selectFrom('hives_locations')
      .innerJoin('hives', 'hives.id', 'hives_locations.hive_id')
      .leftJoin('queens_locations', 'queens_locations.hive_id', 'hives.id')
      .leftJoin('queens', 'queens.id', 'queens_locations.queen_id')
      .select([
        sql<string>`hives.name`.as('name'),
        'hives.id',
        'hives.position',
        'queens_locations.queen_name',
        'queens_locations.queen_modus',
        'queens.mark_colour',
      ])
      .where('hives_locations.apiary_id', '=', apiary.id)
      .where('hives_locations.hive_deleted', '=', false)
      .where('hives_locations.hive_modus', '=', true)
      .orderBy('hives.position', 'asc')
      .orderBy('hives.name', 'asc')
      .execute(),
  ]);

  return { ...apiary, firstMovedate, sameLocation, hives };
}

export async function createApiary(
  db: Kysely<DB>,
  companyId: number,
  beeId: number,
  body: ApiaryCreateBody,
) {
  if (await limitApiary(companyId, db)) {
    throw httpErrors.PaymentRequired(
      'Free plan apiary limit reached — premium subscription required to create more apiaries',
    );
  }
  return db.transaction().execute(async (transaction) => {
    if (await hasDuplicateName(transaction, companyId, body.name)) {
      throw httpErrors.Conflict('name');
    }
    const insert = await transaction
      .insertInto('apiaries')
      .values({
        ...inputValues(body),
        latitude: body.latitude ?? 0,
        longitude: body.longitude ?? 0,
        bee_id: beeId,
        user_id: companyId,
      })
      .executeTakeFirstOrThrow();
    return transaction
      .selectFrom('apiaries')
      .select(apiarySelections())
      .where('id', '=', Number(insert.insertId))
      .executeTakeFirstOrThrow();
  });
}

export function updateApiaries(
  db: Kysely<DB>,
  companyId: number,
  beeId: number,
  ids: number[],
  input: ApiaryValues,
) {
  return db.transaction().execute(async (transaction) => {
    if (input.name !== undefined) {
      if (ids.length > 1) throw httpErrors.Conflict('name');
      if (await hasDuplicateName(transaction, companyId, input.name, ids[0])) {
        throw httpErrors.Conflict('name');
      }
    }
    const result = await transaction
      .updateTable('apiaries')
      .set({ ...inputValues(input), edit_id: beeId })
      .where('id', 'in', ids)
      .where('user_id', '=', companyId)
      .executeTakeFirst();
    return Number(result.numUpdatedRows);
  });
}

export async function updateApiaryStatus(
  db: Database,
  companyId: number,
  beeId: number,
  ids: number[],
  status: boolean,
) {
  const result = await db
    .updateTable('apiaries')
    .set({ edit_id: beeId, modus: status })
    .where('id', 'in', ids)
    .where('user_id', '=', companyId)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}

export function deleteApiaries(
  db: Kysely<DB>,
  companyId: number,
  beeId: number,
  ids: number[],
  options: { hard: boolean; restore: boolean },
) {
  return db.transaction().execute(async (transaction) => {
    const apiaries = await selectApiaries(transaction)
      .where('apiaries.user_id', '=', companyId)
      .where('apiaries.id', 'in', ids)
      .execute();
    const softIds: number[] = [];
    const hardIds: number[] = [];
    for (const apiary of apiaries) {
      if (apiary.hive_count) {
        throw httpErrors.Forbidden(
          'Apiary still contains hives — move or delete the hives first before deleting the apiary',
        );
      }
      if ((apiary.deleted || options.hard) && !options.restore) {
        hardIds.push(apiary.id);
      } else {
        softIds.push(apiary.id);
      }
    }
    if (hardIds.length > 0) {
      await transaction
        .deleteFrom('apiaries')
        .where('user_id', '=', companyId)
        .where('id', 'in', hardIds)
        .execute();
    }
    if (softIds.length > 0) {
      await transaction
        .updateTable('apiaries')
        .set({
          deleted: !options.restore,
          deleted_at: new Date(),
          edit_id: beeId,
        })
        .where('user_id', '=', companyId)
        .where('id', 'in', softIds)
        .execute();
    }
    return apiaries;
  });
}

export function getApiariesByIds(
  db: Database,
  companyId: number,
  ids: number[],
) {
  return db
    .selectFrom('apiaries')
    .select(apiarySelections())
    .where('user_id', '=', companyId)
    .where('id', 'in', ids)
    .execute();
}
