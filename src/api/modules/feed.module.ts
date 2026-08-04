import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { DB } from '../../types/db.types.js';
import type {
  TaskCreateBody,
  TaskListQuery,
  TaskPatchBody,
} from '../schemas/task.schema.js';
import { actorProjection } from './actor_projection.module.js';
import { requireFeedTypeOwnership } from './ownership.module.js';
import {
  hiveProjection,
  optionProjection,
  ownedHiveIds,
  parseTaskFilters,
  taskApiaryProjection,
  taskOrderings,
  taskPagination,
  taskSchedule,
  type TaskActor,
} from './task.module.js';

const orderColumns = {
  id: 'feeds.id',
  date: 'feeds.date',
  enddate: 'feeds.enddate',
  amount: 'feeds.amount',
  done: 'feeds.done',
  created_at: 'feeds.created_at',
  updated_at: 'feeds.updated_at',
  deleted_at: 'feeds.deleted_at',
  'type.name': 'feed_types.name',
  'hive.name': 'hives.name',
  'feed_apiary.apiary_name': 'feeds_apiaries.apiary_name',
} as const;

function amountSelection() {
  return sql<number | null>`CAST(feeds.amount AS DOUBLE)`.as('amount');
}

function feedValues(data: TaskCreateBody | TaskPatchBody['data']) {
  return {
    ...(data.date !== undefined && { date: new Date(data.date) }),
    ...(data.enddate !== undefined && {
      enddate: data.enddate === null ? null : new Date(data.enddate),
    }),
    ...(data.amount !== undefined && { amount: data.amount }),
    ...(data.note !== undefined && { note: data.note }),
    ...(data.url !== undefined && { url: data.url }),
    ...(data.done !== undefined && { done: data.done }),
    ...(data.deleted !== undefined && { deleted: data.deleted }),
    ...(data.type_id !== undefined && { type_id: data.type_id }),
  };
}

export async function listFeeds(
  db: Kysely<DB>,
  companyId: number,
  input: TaskListQuery,
) {
  let base = db
    .selectFrom('feeds')
    .innerJoin('hives', 'hives.id', 'feeds.hive_id')
    .leftJoin('feeds_apiaries', 'feeds_apiaries.feed_id', 'feeds.id')
    .leftJoin('feed_types', 'feed_types.id', 'feeds.type_id')
    .leftJoin('bees as creator', 'creator.id', 'feeds.bee_id')
    .leftJoin('bees as editor', 'editor.id', 'feeds.edit_id')
    .where('feeds.user_id', '=', companyId)
    .where('feeds.deleted', '=', input.deleted === true)
    .where('hives.deleted', '=', false);
  if (input.done !== undefined && input.done !== null) {
    base = base.where('feeds.done', '=', input.done);
  }
  for (const filter of parseTaskFilters(input.filters)) {
    if (filter.field === 'date' && filter.from && filter.to) {
      base = base
        .where('feeds.date', '>=', filter.from)
        .where('feeds.date', '<=', filter.to);
    } else if (filter.field === 'hive_id_array' && filter.values) {
      base = base.where('feeds.hive_id', 'in', filter.values);
    } else if (
      (filter.field === 'feeds.type_id' || filter.field === 'type_id') &&
      filter.value !== undefined
    ) {
      base = base.where('feeds.type_id', '=', filter.value);
    } else if (
      (filter.field === 'feeds.hive_id' || filter.field === 'hive_id') &&
      filter.value !== undefined
    ) {
      base = base.where('feeds.hive_id', '=', filter.value);
    } else if (
      (filter.field === 'feed_apiary.apiary_id' ||
        filter.field === 'apiary_id') &&
      filter.value !== undefined
    ) {
      base = base.where('feeds_apiaries.apiary_id', '=', filter.value);
    }
  }
  const search = input.q?.trim() ?? '';
  if (search) {
    base = base.where((expression) =>
      expression.or([
        expression('hives.name', 'like', `%${search}%`),
        expression('feed_types.name', 'like', `%${search}%`),
      ]),
    );
  }
  const count = await base
    .select(sql<number | string>`COUNT(feeds.id)`.as('count'))
    .executeTakeFirstOrThrow();
  let query = base.select([
    'feeds.id',
    'feeds.date',
    'feeds.enddate',
    amountSelection(),
    'feeds.note',
    'feeds.url',
    'feeds.done',
    'feeds.deleted',
    'feeds.deleted_at',
    'feeds.user_id',
    'feeds.hive_id',
    'feeds.type_id',
    'feeds.bee_id',
    'feeds.edit_id',
    'feeds.ai_created_at',
    'feeds.ai_updated_at',
    'feeds.ai_deleted_at',
    'feeds.created_at',
    'feeds.updated_at',
    hiveProjection(),
    optionProjection('feed_types', 'type'),
    taskApiaryProjection(
      'feeds_apiaries',
      'feed_id',
      'feed_date',
      'feed_apiary',
    ),
    actorProjection('creator'),
    actorProjection('editor'),
  ]);
  for (const ordering of taskOrderings(
    input.order,
    input.direction,
    orderColumns,
  )) {
    query = query.orderBy(sql.ref(ordering.column), ordering.direction);
  }
  const pagination = taskPagination(input.limit, input.offset);
  const results = await query
    .orderBy('feeds.hive_id', 'asc')
    .orderBy('feeds.id', 'asc')
    .limit(pagination.limit)
    .offset(pagination.offset)
    .execute();
  return { results, total: Number(count.count) };
}

export function createFeeds(
  db: Kysely<DB>,
  actor: TaskActor,
  body: TaskCreateBody,
) {
  return db.transaction().execute(async (transaction) => {
    if (body.type_id) {
      await requireFeedTypeOwnership(
        transaction,
        body.type_id,
        actor.companyId,
      );
    }
    const hives = await ownedHiveIds(
      transaction,
      actor.companyId,
      body.hive_ids,
    );
    const schedule = body.date
      ? taskSchedule(
          body.date,
          body.enddate,
          body.interval ?? 0,
          body.repeat ?? 0,
        )
      : [{ date: undefined, enddate: undefined }];
    const ids: number[] = [];
    for (const hiveId of hives) {
      for (const dates of schedule) {
        const result = await transaction
          .insertInto('feeds')
          .values({
            ...feedValues(body),
            ...(dates.date !== undefined && { date: dates.date }),
            ...(dates.enddate !== undefined && { enddate: dates.enddate }),
            hive_id: hiveId,
            bee_id: actor.beeId,
            user_id: actor.companyId,
            ...(actor.isLlm && { ai_created_at: new Date() }),
          })
          .executeTakeFirstOrThrow();
        ids.push(Number(result.insertId));
      }
    }
    return ids;
  });
}

export async function updateFeeds(
  db: Kysely<DB>,
  actor: TaskActor,
  body: TaskPatchBody,
) {
  if (body.data.type_id) {
    await requireFeedTypeOwnership(db, body.data.type_id, actor.companyId);
  }
  const values = feedValues(body.data);
  if (body.data.date && body.data.enddate === undefined) {
    values.enddate = new Date(body.data.date);
  }
  const result = await db
    .updateTable('feeds')
    .set({
      ...values,
      edit_id: actor.beeId,
      ...(actor.isLlm && { ai_updated_at: new Date() }),
    })
    .where('id', 'in', body.ids)
    .where('user_id', '=', actor.companyId)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}

export function getFeedsByIds(
  db: Kysely<DB>,
  companyId: number,
  ids: number[],
) {
  return db
    .selectFrom('feeds')
    .leftJoin('hives', 'hives.id', 'feeds.hive_id')
    .leftJoin('feed_types', 'feed_types.id', 'feeds.type_id')
    .selectAll('feeds')
    .select([
      amountSelection(),
      hiveProjection(),
      optionProjection('feed_types', 'type'),
    ])
    .where('feeds.id', 'in', ids)
    .where('feeds.user_id', '=', companyId)
    .execute();
}
