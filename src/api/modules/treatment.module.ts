import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { DB } from '../../types/db.types.js';
import { getWeatherDataForApiary } from '../adapters/weather.adapter.js';
import type {
  TaskCreateBody,
  TaskListQuery,
  TaskPatchBody,
} from '../schemas/task.schema.js';
import { actorProjection } from './actor_projection.module.js';
import {
  requireTreatmentDiseaseOwnership,
  requireTreatmentTypeOwnership,
  requireTreatmentVetOwnership,
} from './ownership.module.js';
import { isPremium } from './premium.module.js';
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
  id: 'treatments.id',
  date: 'treatments.date',
  enddate: 'treatments.enddate',
  amount: 'treatments.amount',
  wait: 'treatments.wait',
  temperature: 'treatments.temperature',
  done: 'treatments.done',
  created_at: 'treatments.created_at',
  updated_at: 'treatments.updated_at',
  deleted_at: 'treatments.deleted_at',
  'type.name': 'treatment_types.name',
  'disease.name': 'treatment_diseases.name',
  'vet.name': 'treatment_vets.name',
  'hive.name': 'hives.name',
  'treatment_apiary.apiary_name': 'treatments_apiaries.apiary_name',
} as const;

function decimalSelection(
  column: 'treatments.amount' | 'treatments.temperature',
  output: 'amount' | 'temperature',
) {
  return sql<number | null>`CAST(${sql.ref(column)} AS DOUBLE)`.as(output);
}

function treatmentValues(data: TaskCreateBody | TaskPatchBody['data']) {
  return {
    ...(data.date !== undefined && { date: new Date(data.date) }),
    ...(data.enddate !== undefined && {
      enddate: data.enddate === null ? null : new Date(data.enddate),
    }),
    ...(data.amount !== undefined && { amount: data.amount }),
    ...(data.wait !== undefined && { wait: data.wait }),
    ...(data.temperature !== undefined && { temperature: data.temperature }),
    ...(data.note !== undefined && { note: data.note }),
    ...(data.url !== undefined && { url: data.url }),
    ...(data.done !== undefined && { done: data.done }),
    ...(data.deleted !== undefined && { deleted: data.deleted }),
    ...(data.type_id !== undefined && { type_id: data.type_id }),
    ...(data.disease_id !== undefined && { disease_id: data.disease_id }),
    ...(data.vet_id !== undefined && { vet_id: data.vet_id }),
  };
}

export async function listTreatments(
  db: Kysely<DB>,
  companyId: number,
  input: TaskListQuery,
) {
  let base = db
    .selectFrom('treatments')
    .innerJoin('hives', 'hives.id', 'treatments.hive_id')
    .leftJoin(
      'treatments_apiaries',
      'treatments_apiaries.treatment_id',
      'treatments.id',
    )
    .leftJoin('treatment_types', 'treatment_types.id', 'treatments.type_id')
    .leftJoin(
      'treatment_diseases',
      'treatment_diseases.id',
      'treatments.disease_id',
    )
    .leftJoin('treatment_vets', 'treatment_vets.id', 'treatments.vet_id')
    .leftJoin('bees as creator', 'creator.id', 'treatments.bee_id')
    .leftJoin('bees as editor', 'editor.id', 'treatments.edit_id')
    .where('treatments.user_id', '=', companyId)
    .where('treatments.deleted', '=', input.deleted === true)
    .where('hives.deleted', '=', false);
  if (input.done !== undefined && input.done !== null) {
    base = base.where('treatments.done', '=', input.done);
  }
  for (const filter of parseTaskFilters(input.filters)) {
    if (filter.field === 'date' && filter.from && filter.to) {
      base = base
        .where('treatments.date', '>=', filter.from)
        .where('treatments.date', '<=', filter.to);
    } else if (filter.field === 'hive_id_array' && filter.values) {
      base = base.where('treatments.hive_id', 'in', filter.values);
    } else if (
      (filter.field === 'treatments.type_id' || filter.field === 'type_id') &&
      filter.value !== undefined
    ) {
      base = base.where('treatments.type_id', '=', filter.value);
    } else if (
      (filter.field === 'treatments.disease_id' ||
        filter.field === 'disease_id') &&
      filter.value !== undefined
    ) {
      base = base.where('treatments.disease_id', '=', filter.value);
    } else if (
      (filter.field === 'treatments.vet_id' || filter.field === 'vet_id') &&
      filter.value !== undefined
    ) {
      base = base.where('treatments.vet_id', '=', filter.value);
    } else if (
      (filter.field === 'treatments.hive_id' || filter.field === 'hive_id') &&
      filter.value !== undefined
    ) {
      base = base.where('treatments.hive_id', '=', filter.value);
    } else if (
      (filter.field === 'treatment_apiary.apiary_id' ||
        filter.field === 'apiary_id') &&
      filter.value !== undefined
    ) {
      base = base.where('treatments_apiaries.apiary_id', '=', filter.value);
    }
  }
  const search = input.q?.trim() ?? '';
  if (search) {
    base = base.where((expression) =>
      expression.or([
        expression('hives.name', 'like', `%${search}%`),
        expression('treatment_types.name', 'like', `%${search}%`),
        expression('treatment_diseases.name', 'like', `%${search}%`),
      ]),
    );
  }
  const count = await base
    .select(sql<number | string>`COUNT(treatments.id)`.as('count'))
    .executeTakeFirstOrThrow();
  let query = base.select([
    'treatments.id',
    'treatments.date',
    'treatments.enddate',
    decimalSelection('treatments.amount', 'amount'),
    'treatments.wait',
    decimalSelection('treatments.temperature', 'temperature'),
    'treatments.disease_id',
    'treatments.vet_id',
    'treatments.note',
    'treatments.url',
    'treatments.done',
    'treatments.deleted',
    'treatments.deleted_at',
    'treatments.user_id',
    'treatments.hive_id',
    'treatments.type_id',
    'treatments.bee_id',
    'treatments.edit_id',
    'treatments.ai_created_at',
    'treatments.ai_updated_at',
    'treatments.ai_deleted_at',
    'treatments.created_at',
    'treatments.updated_at',
    hiveProjection(),
    optionProjection('treatment_types', 'type'),
    optionProjection('treatment_diseases', 'disease'),
    optionProjection('treatment_vets', 'vet'),
    taskApiaryProjection(
      'treatments_apiaries',
      'treatment_id',
      'treatment_date',
      'treatment_apiary',
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
    .orderBy('treatments.hive_id', 'asc')
    .orderBy('treatments.id', 'asc')
    .limit(pagination.limit)
    .offset(pagination.offset)
    .execute();
  return { results, total: Number(count.count) };
}

export async function createTreatments(
  db: Kysely<DB>,
  actor: TaskActor,
  body: TaskCreateBody,
) {
  let input = body;
  if (
    body.temperature === undefined &&
    (await isPremium(actor.companyId, db))
  ) {
    try {
      const location = await db
        .selectFrom('hives_locations')
        .select('apiary_id')
        .where('hive_id', '=', body.hive_ids[0])
        .where('user_id', '=', actor.companyId)
        .executeTakeFirst();
      if (location?.apiary_id) {
        const weather = await getWeatherDataForApiary(
          db,
          location.apiary_id,
          actor.companyId,
        );
        if (weather?.current?.temp !== undefined) {
          input = { ...body, temperature: weather.current.temp };
        }
      }
    } catch {
      input = body;
    }
  }
  return db.transaction().execute(async (transaction) => {
    if (input.type_id) {
      await requireTreatmentTypeOwnership(
        transaction,
        input.type_id,
        actor.companyId,
      );
    }
    if (input.disease_id) {
      await requireTreatmentDiseaseOwnership(
        transaction,
        input.disease_id,
        actor.companyId,
      );
    }
    if (input.vet_id) {
      await requireTreatmentVetOwnership(
        transaction,
        input.vet_id,
        actor.companyId,
      );
    }
    const hives = await ownedHiveIds(
      transaction,
      actor.companyId,
      input.hive_ids,
    );
    const schedule = input.date
      ? taskSchedule(
          input.date,
          input.enddate,
          input.interval ?? 0,
          input.repeat ?? 0,
        )
      : [{ date: undefined, enddate: undefined }];
    const ids: number[] = [];
    for (const hiveId of hives) {
      for (const dates of schedule) {
        const result = await transaction
          .insertInto('treatments')
          .values({
            ...treatmentValues(input),
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

export async function updateTreatments(
  db: Kysely<DB>,
  actor: TaskActor,
  body: TaskPatchBody,
) {
  if (body.data.type_id) {
    await requireTreatmentTypeOwnership(db, body.data.type_id, actor.companyId);
  }
  if (body.data.disease_id) {
    await requireTreatmentDiseaseOwnership(
      db,
      body.data.disease_id,
      actor.companyId,
    );
  }
  if (body.data.vet_id) {
    await requireTreatmentVetOwnership(db, body.data.vet_id, actor.companyId);
  }
  const values = treatmentValues(body.data);
  if (body.data.date && body.data.enddate === undefined) {
    values.enddate = new Date(body.data.date);
  }
  const result = await db
    .updateTable('treatments')
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

export function getTreatmentsByIds(
  db: Kysely<DB>,
  companyId: number,
  ids: number[],
) {
  return db
    .selectFrom('treatments')
    .leftJoin('hives', 'hives.id', 'treatments.hive_id')
    .leftJoin('treatment_types', 'treatment_types.id', 'treatments.type_id')
    .leftJoin(
      'treatment_diseases',
      'treatment_diseases.id',
      'treatments.disease_id',
    )
    .leftJoin('treatment_vets', 'treatment_vets.id', 'treatments.vet_id')
    .selectAll('treatments')
    .select([
      decimalSelection('treatments.amount', 'amount'),
      decimalSelection('treatments.temperature', 'temperature'),
      hiveProjection(),
      optionProjection('treatment_types', 'type'),
      optionProjection('treatment_diseases', 'disease'),
      optionProjection('treatment_vets', 'vet'),
    ])
    .where('treatments.id', 'in', ids)
    .where('treatments.user_id', '=', companyId)
    .execute();
}
