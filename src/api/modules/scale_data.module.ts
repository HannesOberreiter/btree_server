import dayjs from 'dayjs';
import httpErrors from 'http-errors';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { Database } from '../../types/database.types.js';
import type { DB } from '../../types/db.types.js';
import type {
  ExternalScaleParams,
  ExternalScaleQuery,
} from '../schemas/external.schema.js';
import type {
  BatchDeleteBody,
  BatchGetBody,
  PatchBody,
  PostBody,
  ScaleDataListQuery,
  ScaleDataOrderField,
} from '../schemas/scale_data.schema.js';
import { checkOwnership } from '../utils/kysely.utils.js';

const orderColumns: Record<
  ScaleDataOrderField,
  | 'scale_data.id'
  | 'scales.name'
  | 'hives.name'
  | 'scale_data.datetime'
  | 'scale_data.weight'
  | 'scale_data.temp1'
  | 'scale_data.temp2'
  | 'scale_data.humidity'
  | 'scale_data.rain'
  | 'scale_data.note'
> = {
  id: 'scale_data.id',
  'scale.name': 'scales.name',
  'scale.hive.name': 'hives.name',
  datetime: 'scale_data.datetime',
  weight: 'scale_data.weight',
  temp1: 'scale_data.temp1',
  temp2: 'scale_data.temp2',
  humidity: 'scale_data.humidity',
  rain: 'scale_data.rain',
  note: 'scale_data.note',
};

interface DateRangeFilter {
  date: { from: string; to: string };
}

type ValueFilter =
  | { scale_id: number }
  | { weight: number }
  | { temp1: number }
  | { temp2: number }
  | { humidity: number }
  | { rain: number }
  | { note: string };

type ScaleDataFilter = DateRangeFilter | ValueFilter;

function parseFilters(value?: string): ScaleDataFilter[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((filter): ScaleDataFilter[] => {
      if (!filter || typeof filter !== 'object') return [];
      const candidate = filter as Record<string, unknown>;
      const date = candidate.date;
      if (date && typeof date === 'object') {
        const range = date as Record<string, unknown>;
        if (typeof range.from === 'string' && typeof range.to === 'string') {
          return [{ date: { from: range.from, to: range.to } }];
        }
      }
      if (typeof candidate.scale_id === 'number')
        return [{ scale_id: candidate.scale_id }];
      if (typeof candidate.weight === 'number')
        return [{ weight: candidate.weight }];
      if (typeof candidate.temp1 === 'number')
        return [{ temp1: candidate.temp1 }];
      if (typeof candidate.temp2 === 'number')
        return [{ temp2: candidate.temp2 }];
      if (typeof candidate.humidity === 'number')
        return [{ humidity: candidate.humidity }];
      if (typeof candidate.rain === 'number') return [{ rain: candidate.rain }];
      if (typeof candidate.note === 'string') return [{ note: candidate.note }];
      return [];
    });
  } catch {
    return [];
  }
}

interface HiveSummary {
  id: number;
  name: string | null;
  grouphive: number | null;
  position: number | null;
  note: string | null;
  modus: boolean | null;
  modus_date: string | null;
  deleted: boolean | null;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: number | null;
  bee_id: number | null;
  edit_id: number | null;
  type_id: number | null;
  source_id: number | null;
}

function scaleProjection() {
  return sql<{
    id: number;
    name: string | null;
    hive_id: number | null;
    user_id: number | null;
    hive: HiveSummary | null;
  }>`
    JSON_OBJECT(
      'id', scales.id,
      'name', scales.name,
      'hive_id', scales.hive_id,
      'user_id', scales.user_id,
      'hive', CASE WHEN hives.id IS NOT NULL THEN JSON_OBJECT(
        'id', hives.id,
        'name', hives.name,
        'grouphive', hives.grouphive,
        'position', hives.position,
        'note', hives.note,
        'modus', IF(hives.modus = 1, TRUE, FALSE),
        'modus_date', hives.modus_date,
        'deleted', IF(hives.deleted = 1, TRUE, FALSE),
        'deleted_at', hives.deleted_at,
        'created_at', hives.created_at,
        'updated_at', hives.updated_at,
        'user_id', hives.user_id,
        'bee_id', hives.bee_id,
        'edit_id', hives.edit_id,
        'type_id', hives.type_id,
        'source_id', hives.source_id
      ) ELSE NULL END
    )
  `.as('scale');
}

function buildScaleDataQuery(
  db: Database,
  companyId: number,
  input: ScaleDataListQuery & { ids?: number[] },
) {
  let query = db
    .selectFrom('scale_data')
    .innerJoin('scales', 'scales.id', 'scale_data.scale_id')
    .leftJoin('hives', 'hives.id', 'scales.hive_id')
    .where('scales.user_id', '=', companyId)
    .$if(input.ids !== undefined, (qb) =>
      qb.where('scale_data.id', 'in', input.ids ?? []),
    );

  const search = input.q === undefined ? '' : String(input.q).trim();
  if (search) query = query.where('scales.name', 'like', `%${search}%`);

  for (const filter of parseFilters(input.filters)) {
    if ('date' in filter) {
      query = query
        .where('scale_data.datetime', '>=', new Date(filter.date.from))
        .where('scale_data.datetime', '<=', new Date(filter.date.to));
    } else if ('scale_id' in filter) {
      query = query.where('scale_data.scale_id', '=', filter.scale_id);
    } else if ('weight' in filter) {
      query = query.where('scale_data.weight', '=', String(filter.weight));
    } else if ('temp1' in filter) {
      query = query.where('scale_data.temp1', '=', String(filter.temp1));
    } else if ('temp2' in filter) {
      query = query.where('scale_data.temp2', '=', String(filter.temp2));
    } else if ('humidity' in filter) {
      query = query.where('scale_data.humidity', '=', String(filter.humidity));
    } else if ('rain' in filter) {
      query = query.where('scale_data.rain', '=', String(filter.rain));
    } else if ('note' in filter) {
      query = query.where('scale_data.note', '=', filter.note);
    }
  }
  return query;
}

function selectScaleData(query: ReturnType<typeof buildScaleDataQuery>) {
  return query.select([
    'scale_data.id',
    sql<string | null>`scale_data.datetime`.as('datetime'),
    'scale_data.weight',
    'scale_data.temp1',
    'scale_data.temp2',
    'scale_data.rain',
    'scale_data.humidity',
    'scale_data.note',
    'scale_data.scale_id',
    scaleProjection(),
  ]);
}

export async function listScaleData(
  db: Database,
  companyId: number,
  input: ScaleDataListQuery,
) {
  const page = input.offset ?? 0;
  const limit =
    input.limit === 0 || input.limit === undefined ? 10 : input.limit;
  const base = buildScaleDataQuery(db, companyId, input);
  let query = selectScaleData(base);

  if (input.order) {
    const fields = Array.isArray(input.order) ? input.order : [input.order];
    fields.forEach((field, index) => {
      const direction = Array.isArray(input.direction)
        ? input.direction[index]
        : input.direction;
      query = query.orderBy(orderColumns[field], direction ?? 'asc');
    });
  }

  const [results, count] = await Promise.all([
    query
      .orderBy('scale_data.id', 'asc')
      .limit(limit)
      .offset(page * limit)
      .execute(),
    base.select(sql<number | string>`COUNT(*)`.as('count')).executeTakeFirst(),
  ]);
  return { results, total: Number(count?.count ?? 0) };
}

export async function createScaleData(
  db: Database,
  companyId: number,
  body: PostBody,
) {
  await checkOwnership(db, 'scales', body.scale_id, companyId);
  const insert = await db
    .insertInto('scale_data')
    .values({
      datetime: new Date(body.datetime),
      weight: body.weight ?? null,
      temp1: body.temp1 ?? null,
      temp2: body.temp2 ?? null,
      rain: body.rain ?? null,
      humidity: body.humidity ?? null,
      note: body.note ?? null,
      scale_id: body.scale_id,
    })
    .executeTakeFirstOrThrow();
  return db
    .selectFrom('scale_data')
    .select([
      'id',
      sql<string | null>`datetime`.as('datetime'),
      'weight',
      'temp1',
      'temp2',
      'rain',
      'humidity',
      'note',
      'scale_id',
    ])
    .where('id', '=', Number(insert.insertId))
    .executeTakeFirstOrThrow();
}

export async function updateScaleData(
  db: Database,
  companyId: number,
  body: PatchBody,
) {
  if (body.data.scale_id) {
    await checkOwnership(db, 'scales', body.data.scale_id, companyId);
  }
  const result = await db
    .updateTable('scale_data')
    .set({
      ...(body.data.datetime !== undefined && {
        datetime: new Date(body.data.datetime),
      }),
      ...(body.data.weight !== undefined && { weight: body.data.weight }),
      ...(body.data.temp1 !== undefined && { temp1: body.data.temp1 }),
      ...(body.data.temp2 !== undefined && { temp2: body.data.temp2 }),
      ...(body.data.rain !== undefined && { rain: body.data.rain }),
      ...(body.data.humidity !== undefined && {
        humidity: body.data.humidity,
      }),
      ...(body.data.note !== undefined && { note: body.data.note }),
      ...(body.data.scale_id !== undefined && {
        scale_id: body.data.scale_id,
      }),
    })
    .where('id', 'in', body.ids)
    .where('scale_id', 'in', (qb) =>
      qb.selectFrom('scales').select('id').where('user_id', '=', companyId),
    )
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}

export function getScaleDataByIds(
  db: Database,
  companyId: number,
  body: BatchGetBody,
) {
  return selectScaleData(
    buildScaleDataQuery(db, companyId, { ids: body.ids }),
  ).execute();
}

export async function deleteScaleData(
  db: Database,
  companyId: number,
  body: BatchDeleteBody,
) {
  const result = await db
    .deleteFrom('scale_data')
    .where('id', 'in', body.ids)
    .where('scale_id', 'in', (qb) =>
      qb.selectFrom('scales').select('id').where('user_id', '=', companyId),
    )
    .executeTakeFirst();
  return Number(result.numDeletedRows);
}

export interface WeightWarning {
  scaleName: string | null;
  difference: number;
  previousWeight: number;
  currentWeight: number;
  recipients: Array<{
    email: string | null;
    username: string | null;
    lang: string | null;
  }>;
}

export async function ingestScaleReading(
  db: Kysely<DB>,
  params: ExternalScaleParams,
  input: ExternalScaleQuery,
): Promise<{ result: Record<string, unknown>; warning?: WeightWarning }> {
  const company = await db
    .selectFrom('companies')
    .select(['id', 'paid'])
    .where('api_key', '=', params.api)
    .executeTakeFirst();
  if (!company) throw httpErrors.NotFound('Company not found');
  if (!dayjs(company.paid).isAfter(dayjs())) {
    throw httpErrors.PaymentRequired();
  }

  const scale = await db
    .selectFrom('scales')
    .select(['id', 'name'])
    .where('name', '=', params.ident)
    .where('user_id', '=', company.id)
    .executeTakeFirst();
  if (!scale) throw httpErrors.NotFound('Scale not found');

  const insertDate = input.datetime ? new Date(input.datetime) : new Date();
  const last = await db
    .selectFrom('scale_data')
    .select(['datetime', 'weight'])
    .where('scale_id', '=', scale.id)
    .orderBy('datetime', 'desc')
    .executeTakeFirst();

  if (
    last?.datetime &&
    input.action === 'CREATE' &&
    dayjs(last.datetime).isAfter(dayjs(insertDate).subtract(1, 'hour'))
  ) {
    throw httpErrors.TooManyRequests();
  }

  let warning: WeightWarning | undefined;
  if (
    last?.weight &&
    Number(last.weight) !== 0 &&
    input.weight &&
    input.action === 'CREATE'
  ) {
    const previousWeight = Number(last.weight);
    const difference = Math.abs(previousWeight - input.weight);
    if (difference > 5) {
      const recipients = await db
        .selectFrom('company_bee')
        .innerJoin('bees', 'bees.id', 'company_bee.bee_id')
        .select(['bees.email', 'bees.username', 'bees.lang'])
        .where('company_bee.rank', '=', 1)
        .where('company_bee.user_id', '=', company.id)
        .execute();
      warning = {
        scaleName: scale.name,
        difference,
        previousWeight,
        currentWeight: input.weight,
        recipients,
      };
    }
  }

  const values = {
    datetime: insertDate,
    weight: input.weight ?? 0,
    temp1: input.temp1 ?? 0,
    temp2: input.temp2 ?? 0,
    rain: input.rain ?? 0,
    humidity: input.hum ?? 0,
    note: input.note ?? '',
    scale_id: scale.id,
  };
  if (input.action === 'CREATE_DEMO') {
    return { result: values, warning };
  }

  const inserted = await db
    .insertInto('scale_data')
    .values(values)
    .executeTakeFirstOrThrow();
  return {
    result: { id: Number(inserted.insertId), ...values },
    warning,
  };
}
