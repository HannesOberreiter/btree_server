import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { DB } from '../../types/db.types.js';
import type {
  CheckupBatchUpdateBody,
  CheckupCreateBody,
  CheckupListQuery,
} from '../schemas/checkup.schema.js';
import { checkOwnership } from '../utils/kysely.utils.js';
import { isPremium } from '../utils/premium.util.js';
import { getWeatherDataForApiary } from '../utils/temperature.util.js';
import {
  hiveProjection,
  identifierProjection,
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
  id: 'checkups.id',
  date: 'checkups.date',
  enddate: 'checkups.enddate',
  queen: 'checkups.queen',
  eggs: 'checkups.eggs',
  capped_brood: 'checkups.capped_brood',
  queencells: 'checkups.queencells',
  brood: 'checkups.brood',
  pollen: 'checkups.pollen',
  comb: 'checkups.comb',
  temper: 'checkups.temper',
  calm_comb: 'checkups.calm_comb',
  swarm: 'checkups.swarm',
  broodframes: 'checkups.broodframes',
  honeyframes: 'checkups.honeyframes',
  foundation: 'checkups.foundation',
  emptyframes: 'checkups.emptyframes',
  varroa: 'checkups.varroa',
  strong: 'checkups.strong',
  temperature: 'checkups.temperature',
  weight: 'checkups.weight',
  done: 'checkups.done',
  created_at: 'checkups.created_at',
  updated_at: 'checkups.updated_at',
  deleted_at: 'checkups.deleted_at',
  'type.name': 'checkup_types.name',
  'hive.name': 'hives.name',
  'checkup_apiary.apiary_name': 'checkups_apiaries.apiary_name',
} as const;

function checkupValues(
  data: CheckupCreateBody | CheckupBatchUpdateBody['data'],
) {
  return {
    ...(data.date !== undefined && { date: new Date(data.date) }),
    ...(data.enddate !== undefined && {
      enddate: data.enddate === null ? null : new Date(data.enddate),
    }),
    ...(data.queen !== undefined && { queen: data.queen }),
    ...(data.queencells !== undefined && { queencells: data.queencells }),
    ...(data.eggs !== undefined && { eggs: data.eggs }),
    ...(data.capped_brood !== undefined && { capped_brood: data.capped_brood }),
    ...(data.brood !== undefined && { brood: data.brood }),
    ...(data.pollen !== undefined && { pollen: data.pollen }),
    ...(data.comb !== undefined && { comb: data.comb }),
    ...(data.temper !== undefined && { temper: data.temper }),
    ...(data.calm_comb !== undefined && { calm_comb: data.calm_comb }),
    ...(data.swarm !== undefined && { swarm: data.swarm }),
    ...(data.varroa !== undefined && { varroa: data.varroa }),
    ...(data.strong !== undefined && { strong: data.strong }),
    ...(data.temperature !== undefined && { temperature: data.temperature }),
    ...(data.weight !== undefined && { weight: data.weight }),
    ...(data.time !== undefined && { time: data.time }),
    ...(data.broodframes !== undefined && { broodframes: data.broodframes }),
    ...(data.honeyframes !== undefined && { honeyframes: data.honeyframes }),
    ...(data.foundation !== undefined && { foundation: data.foundation }),
    ...(data.emptyframes !== undefined && { emptyframes: data.emptyframes }),
    ...(data.note !== undefined && { note: data.note }),
    ...(data.url !== undefined && { url: data.url }),
    ...(data.done !== undefined && { done: data.done }),
    ...(data.deleted !== undefined && { deleted: data.deleted }),
    ...(data.type_id !== undefined && { type_id: data.type_id }),
  };
}

function decimalSelection(
  column:
    | 'checkups.brood'
    | 'checkups.pollen'
    | 'checkups.comb'
    | 'checkups.temper'
    | 'checkups.calm_comb'
    | 'checkups.swarm'
    | 'checkups.varroa'
    | 'checkups.temperature'
    | 'checkups.weight',
  output:
    | 'brood'
    | 'pollen'
    | 'comb'
    | 'temper'
    | 'calm_comb'
    | 'swarm'
    | 'varroa'
    | 'temperature'
    | 'weight',
) {
  return sql<number | null>`CAST(${sql.ref(column)} AS DOUBLE)`.as(output);
}

function checkupSelections() {
  return [
    'checkups.id',
    'checkups.date',
    'checkups.enddate',
    'checkups.queen',
    'checkups.queencells',
    'checkups.eggs',
    'checkups.capped_brood',
    decimalSelection('checkups.brood', 'brood'),
    decimalSelection('checkups.pollen', 'pollen'),
    decimalSelection('checkups.comb', 'comb'),
    decimalSelection('checkups.temper', 'temper'),
    decimalSelection('checkups.calm_comb', 'calm_comb'),
    decimalSelection('checkups.swarm', 'swarm'),
    decimalSelection('checkups.varroa', 'varroa'),
    'checkups.strong',
    decimalSelection('checkups.temperature', 'temperature'),
    decimalSelection('checkups.weight', 'weight'),
    'checkups.time',
    'checkups.broodframes',
    'checkups.honeyframes',
    'checkups.foundation',
    'checkups.emptyframes',
    'checkups.note',
    'checkups.url',
    'checkups.done',
    'checkups.deleted',
    'checkups.deleted_at',
    'checkups.user_id',
    'checkups.hive_id',
    'checkups.type_id',
    'checkups.bee_id',
    'checkups.edit_id',
    'checkups.ai_created_at',
    'checkups.ai_updated_at',
    'checkups.ai_deleted_at',
    'checkups.created_at',
    'checkups.updated_at',
  ] as const;
}

export async function listCheckups(
  db: Kysely<DB>,
  companyId: number,
  input: CheckupListQuery,
) {
  let base = db
    .selectFrom('checkups')
    .innerJoin('hives', 'hives.id', 'checkups.hive_id')
    .leftJoin(
      'checkups_apiaries',
      'checkups_apiaries.checkup_id',
      'checkups.id',
    )
    .leftJoin('checkup_types', 'checkup_types.id', 'checkups.type_id')
    .leftJoin('bees as creator', 'creator.id', 'checkups.bee_id')
    .leftJoin('bees as editor', 'editor.id', 'checkups.edit_id')
    .where('checkups.user_id', '=', companyId)
    .where('checkups.deleted', '=', input.deleted === true)
    .where('hives.deleted', '=', false);
  if (input.done !== undefined && input.done !== null) {
    base = base.where('checkups.done', '=', input.done);
  }
  for (const filter of parseTaskFilters(input.filters)) {
    if (filter.field === 'date' && filter.from && filter.to) {
      base = base
        .where('checkups.date', '>=', filter.from)
        .where('checkups.date', '<=', filter.to);
    } else if (filter.field === 'hive_id_array' && filter.values) {
      base = base.where('checkups.hive_id', 'in', filter.values);
    } else if (
      (filter.field === 'checkups.type_id' || filter.field === 'type_id') &&
      filter.value !== undefined
    ) {
      base = base.where('checkups.type_id', '=', filter.value);
    } else if (
      (filter.field === 'checkups.hive_id' || filter.field === 'hive_id') &&
      filter.value !== undefined
    ) {
      base = base.where('checkups.hive_id', '=', filter.value);
    } else if (
      (filter.field === 'checkup_apiary.apiary_id' ||
        filter.field === 'apiary_id') &&
      filter.value !== undefined
    ) {
      base = base.where('checkups_apiaries.apiary_id', '=', filter.value);
    }
  }
  const search = input.q === undefined ? '' : String(input.q).trim();
  if (search) {
    base = base.where((expression) =>
      expression.or([
        expression('hives.name', 'like', `%${search}%`),
        expression('checkup_types.name', 'like', `%${search}%`),
      ]),
    );
  }
  const count = await base
    .select(sql<number | string>`COUNT(checkups.id)`.as('count'))
    .executeTakeFirstOrThrow();
  let query = base.select([
    ...checkupSelections(),
    hiveProjection(),
    optionProjection('checkup_types', 'type'),
    taskApiaryProjection(
      'checkups_apiaries',
      'checkup_id',
      'checkup_date',
      'checkup_apiary',
    ),
    identifierProjection('creator'),
    identifierProjection('editor'),
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
    .orderBy('checkups.hive_id', 'asc')
    .orderBy('checkups.id', 'asc')
    .limit(pagination.limit)
    .offset(pagination.offset)
    .execute();
  return { results, total: Number(count.count) };
}

export async function createCheckups(
  db: Kysely<DB>,
  actor: TaskActor,
  body: CheckupCreateBody,
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
      await checkOwnership(
        transaction,
        'checkup_types',
        input.type_id,
        actor.companyId,
      );
    }
    const hives = await ownedHiveIds(
      transaction,
      actor.companyId,
      input.hive_ids,
    );
    const schedule = taskSchedule(
      input.date,
      input.enddate,
      input.interval,
      input.repeat,
    );
    const ids: number[] = [];
    for (const hiveId of hives) {
      for (const dates of schedule) {
        const result = await transaction
          .insertInto('checkups')
          .values({
            ...checkupValues(input),
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

export async function updateCheckups(
  db: Kysely<DB>,
  actor: TaskActor,
  body: CheckupBatchUpdateBody,
) {
  if (body.data.type_id) {
    await checkOwnership(
      db,
      'checkup_types',
      body.data.type_id,
      actor.companyId,
    );
  }
  const values = checkupValues(body.data);
  if (body.data.date && body.data.enddate === undefined) {
    values.enddate = new Date(body.data.date);
  }
  const result = await db
    .updateTable('checkups')
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

export function getCheckupsByIds(
  db: Kysely<DB>,
  companyId: number,
  ids: number[],
) {
  return db
    .selectFrom('checkups')
    .leftJoin('hives', 'hives.id', 'checkups.hive_id')
    .leftJoin('checkup_types', 'checkup_types.id', 'checkups.type_id')
    .select(checkupSelections())
    .select([hiveProjection(), optionProjection('checkup_types', 'type')])
    .where('checkups.id', 'in', ids)
    .where('checkups.user_id', '=', companyId)
    .execute();
}
