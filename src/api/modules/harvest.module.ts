import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { DB } from '../../types/db.types.js';
import type {
  TaskCreateBody,
  TaskListQuery,
  TaskPatchBody,
} from '../schemas/task.schema.js';
import { actorProjection } from './actor_projection.module.js';
import { requireHarvestTypeOwnership } from './ownership.module.js';
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
  id: 'harvests.id',
  date: 'harvests.date',
  enddate: 'harvests.enddate',
  amount: 'harvests.amount',
  frames: 'harvests.frames',
  water: 'harvests.water',
  charge: 'harvests.charge',
  done: 'harvests.done',
  created_at: 'harvests.created_at',
  updated_at: 'harvests.updated_at',
  deleted_at: 'harvests.deleted_at',
  'type.name': 'harvest_types.name',
  'hive.name': 'hives.name',
  'harvest_apiary.apiary_name': 'harvests_apiaries.apiary_name',
} as const;

function decimalSelection(
  column: 'harvests.amount' | 'harvests.frames' | 'harvests.water',
  output: 'amount' | 'frames' | 'water',
) {
  return sql<number | null>`CAST(${sql.ref(column)} AS DOUBLE)`.as(output);
}

function harvestValues(data: TaskCreateBody | TaskPatchBody['data']) {
  return {
    ...(data.date !== undefined && { date: new Date(data.date) }),
    ...(data.enddate !== undefined && {
      enddate: data.enddate === null ? null : new Date(data.enddate),
    }),
    ...(data.amount !== undefined && { amount: data.amount }),
    ...(data.frames !== undefined && { frames: data.frames }),
    ...(data.water !== undefined && { water: data.water }),
    ...(data.charge !== undefined && { charge: data.charge }),
    ...(data.note !== undefined && { note: data.note }),
    ...(data.url !== undefined && { url: data.url }),
    ...(data.done !== undefined && { done: data.done }),
    ...(data.deleted !== undefined && { deleted: data.deleted }),
    ...(data.type_id !== undefined && { type_id: data.type_id }),
  };
}

export async function listHarvests(
  db: Kysely<DB>,
  companyId: number,
  input: TaskListQuery,
) {
  let base = db
    .selectFrom('harvests')
    .innerJoin('hives', 'hives.id', 'harvests.hive_id')
    .leftJoin(
      'harvests_apiaries',
      'harvests_apiaries.harvest_id',
      'harvests.id',
    )
    .leftJoin('harvest_types', 'harvest_types.id', 'harvests.type_id')
    .leftJoin('bees as creator', 'creator.id', 'harvests.bee_id')
    .leftJoin('bees as editor', 'editor.id', 'harvests.edit_id')
    .where('harvests.user_id', '=', companyId)
    .where('harvests.deleted', '=', input.deleted === true)
    .where('hives.deleted', '=', false);
  if (input.done !== undefined && input.done !== null) {
    base = base.where('harvests.done', '=', input.done);
  }
  for (const filter of parseTaskFilters(input.filters)) {
    if (filter.field === 'date' && filter.from && filter.to) {
      base = base
        .where('harvests.date', '>=', filter.from)
        .where('harvests.date', '<=', filter.to);
    } else if (filter.field === 'hive_id_array' && filter.values) {
      base = base.where('harvests.hive_id', 'in', filter.values);
    } else if (
      (filter.field === 'harvests.type_id' || filter.field === 'type_id') &&
      filter.value !== undefined
    ) {
      base = base.where('harvests.type_id', '=', filter.value);
    } else if (
      (filter.field === 'harvests.hive_id' || filter.field === 'hive_id') &&
      filter.value !== undefined
    ) {
      base = base.where('harvests.hive_id', '=', filter.value);
    } else if (
      (filter.field === 'harvest_apiary.apiary_id' ||
        filter.field === 'apiary_id') &&
      filter.value !== undefined
    ) {
      base = base.where('harvests_apiaries.apiary_id', '=', filter.value);
    }
  }
  const search = input.q?.trim() ?? '';
  if (search) {
    base = base.where((expression) =>
      expression.or([
        expression('hives.name', 'like', `%${search}%`),
        expression('harvest_types.name', 'like', `%${search}%`),
        expression('harvests.charge', 'like', `%${search}%`),
      ]),
    );
  }
  const count = await base
    .select(sql<number | string>`COUNT(harvests.id)`.as('count'))
    .executeTakeFirstOrThrow();
  let query = base.select([
    'harvests.id',
    'harvests.date',
    'harvests.enddate',
    decimalSelection('harvests.amount', 'amount'),
    decimalSelection('harvests.frames', 'frames'),
    decimalSelection('harvests.water', 'water'),
    'harvests.charge',
    'harvests.note',
    'harvests.url',
    'harvests.done',
    'harvests.deleted',
    'harvests.deleted_at',
    'harvests.user_id',
    'harvests.hive_id',
    'harvests.type_id',
    'harvests.bee_id',
    'harvests.edit_id',
    'harvests.ai_created_at',
    'harvests.ai_updated_at',
    'harvests.ai_deleted_at',
    'harvests.created_at',
    'harvests.updated_at',
    hiveProjection(),
    optionProjection('harvest_types', 'type'),
    taskApiaryProjection(
      'harvests_apiaries',
      'harvest_id',
      'harvest_date',
      'harvest_apiary',
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
    .orderBy('harvests.hive_id', 'asc')
    .orderBy('harvests.id', 'asc')
    .limit(pagination.limit)
    .offset(pagination.offset)
    .execute();
  return { results, total: Number(count.count) };
}

export function createHarvests(
  db: Kysely<DB>,
  actor: TaskActor,
  body: TaskCreateBody,
) {
  return db.transaction().execute(async (transaction) => {
    if (body.type_id) {
      await requireHarvestTypeOwnership(
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
          .insertInto('harvests')
          .values({
            ...harvestValues(body),
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

export async function updateHarvests(
  db: Kysely<DB>,
  actor: TaskActor,
  body: TaskPatchBody,
) {
  if (body.data.type_id) {
    await requireHarvestTypeOwnership(db, body.data.type_id, actor.companyId);
  }
  const values = harvestValues(body.data);
  if (body.data.date && body.data.enddate === undefined) {
    values.enddate = new Date(body.data.date);
  }
  const result = await db
    .updateTable('harvests')
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

export function getHarvestsByIds(
  db: Kysely<DB>,
  companyId: number,
  ids: number[],
) {
  return db
    .selectFrom('harvests')
    .leftJoin('hives', 'hives.id', 'harvests.hive_id')
    .leftJoin('harvest_types', 'harvest_types.id', 'harvests.type_id')
    .selectAll('harvests')
    .select([
      decimalSelection('harvests.amount', 'amount'),
      decimalSelection('harvests.frames', 'frames'),
      decimalSelection('harvests.water', 'water'),
      hiveProjection(),
      optionProjection('harvest_types', 'type'),
    ])
    .where('harvests.id', 'in', ids)
    .where('harvests.user_id', '=', companyId)
    .execute();
}
