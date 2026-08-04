import { sql } from 'kysely';

import type { Database } from '../../types/database.types.js';
import type {
  StatisticListQuery,
  StatisticOrderField,
  StatisticSummaryQuery,
  StatisticTask,
  VarroaStatisticQuery,
} from '../schemas/statistic.schema.js';

const taskConfigs = {
  feed: {
    apiaryIdColumn: 'feed_id',
    apiaryDateColumn: 'feed_date',
  },
  harvest: {
    apiaryIdColumn: 'harvest_id',
    apiaryDateColumn: 'harvest_date',
  },
  treatment: {
    apiaryIdColumn: 'treatment_id',
    apiaryDateColumn: 'treatment_date',
  },
} as const;

type TaskSummaryMode = 'year' | 'apiary' | 'type';

type StatisticFilter =
  | { kind: 'year'; value: number }
  | { kind: 'type'; value: number }
  | { kind: 'disease'; value: number }
  | { kind: 'hiveInclude'; value: number[] }
  | { kind: 'hiveExclude'; value: number[] }
  | { kind: 'apiaryInclude'; value: number[] };

const orderColumns: Record<StatisticOrderField, string> = {
  hive_id: 'task.hive_id',
  year: 'year',
  'hive.name': 'hive.name',
  amount_sum: 'amount_sum',
  amount_avg: 'amount_avg',
  frames_sum: 'frames_sum',
  frames_avg: 'frames_avg',
  water_avg: 'water_avg',
  brood: 'brood',
  pollen: 'pollen',
  comb: 'comb',
  temper: 'temper',
  calm_comb: 'calm_comb',
  swarm: 'swarm',
  varroa: 'varroa',
  strong: 'strong',
};

function numericArray(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const numbers = value.map(Number).filter(Number.isFinite);
  return numbers.length === value.length ? numbers : null;
}

function parseStatisticFilters(
  value: string | undefined,
  task?: StatisticTask,
): StatisticFilter[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((filter): StatisticFilter[] => {
      if (!filter || typeof filter !== 'object') return [];
      const candidate = filter as Record<string, unknown>;
      if (
        candidate.year !== undefined &&
        Number.isFinite(Number(candidate.year))
      ) {
        return [{ kind: 'year', value: Number(candidate.year) }];
      }
      const typeValue = task ? candidate[`${task}s.type_id`] : undefined;
      if (typeValue !== undefined && Number.isFinite(Number(typeValue))) {
        return [{ kind: 'type', value: Number(typeValue) }];
      }
      if (
        task === 'treatment' &&
        candidate['treatments.disease_id'] !== undefined &&
        Number.isFinite(Number(candidate['treatments.disease_id']))
      ) {
        return [
          {
            kind: 'disease',
            value: Number(candidate['treatments.disease_id']),
          },
        ];
      }
      const hiveInclude = numericArray(candidate.hive_id_array);
      if (hiveInclude) return [{ kind: 'hiveInclude', value: hiveInclude }];
      const hiveExclude = numericArray(candidate.hive_id_array_exclude);
      if (hiveExclude) return [{ kind: 'hiveExclude', value: hiveExclude }];
      const apiaryInclude = numericArray(candidate.apiary_id_array);
      if (apiaryInclude)
        return [{ kind: 'apiaryInclude', value: apiaryInclude }];
      return [];
    });
  } catch {
    return [];
  }
}

interface HiveProjection {
  id: number;
  name: string | null;
  [key: string]: unknown;
}

interface TaskApiaryProjection {
  apiary_id: number | null;
  apiary_name: string | null;
  user_id: number | null;
  [key: string]: unknown;
}

interface TaskTypeProjection {
  id: number;
  name: string | null;
  [key: string]: unknown;
}

interface TaskSourceRow {
  kind: StatisticTask;
  id: number;
  date: Date | null;
  amount: string | null;
  hive_id: number | null;
  type_id: number | null;
  user_id: number | null;
  deleted: boolean | null;
  frames: number | null;
  water: string | null;
  disease_id: number | null;
}

interface TaskApiarySourceRow {
  kind: StatisticTask;
  task_id: number | null;
  task_date: Date | null;
  apiary_id: number;
  apiary_name: string | null;
  user_id: number | null;
}

interface TaskTypeSourceRow {
  kind: StatisticTask;
  id: number;
  name: string | null;
  favorite: boolean | null;
  modus: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
  user_id: number | null;
}

function hiveProjection() {
  return sql<HiveProjection>`
    JSON_OBJECT(
      'id', hive.id,
      'name', hive.name,
      'grouphive', hive.grouphive,
      'position', hive.position,
      'note', hive.note,
      'modus', IF(hive.modus = 1, TRUE, FALSE),
      'modus_date', hive.modus_date,
      'deleted', IF(hive.deleted = 1, TRUE, FALSE),
      'deleted_at', hive.deleted_at,
      'created_at', hive.created_at,
      'updated_at', hive.updated_at,
      'user_id', hive.user_id,
      'bee_id', hive.bee_id,
      'edit_id', hive.edit_id,
      'type_id', hive.type_id,
      'source_id', hive.source_id
    )
  `.as('hive');
}

function taskTypeProjection() {
  return sql<TaskTypeProjection | null>`
    CASE WHEN task_type.id IS NOT NULL THEN JSON_OBJECT(
      'id', task_type.id,
      'name', task_type.name,
      'favorite', IF(task_type.favorite = 1, TRUE, FALSE),
      'modus', IF(task_type.modus = 1, TRUE, FALSE),
      'created_at', task_type.created_at,
      'updated_at', task_type.updated_at,
      'user_id', task_type.user_id
    ) ELSE NULL END
  `.as('type');
}

function taskApiaryProjection(task: StatisticTask) {
  const config = taskConfigs[task];
  return sql<TaskApiaryProjection | null>`
    CASE WHEN task_apiary.apiary_id IS NOT NULL THEN JSON_OBJECT(
      'apiary_id', task_apiary.apiary_id,
      'apiary_name', task_apiary.apiary_name,
      'user_id', task_apiary.user_id,
      ${sql.lit(config.apiaryIdColumn)}, task_apiary.task_id,
      ${sql.lit(config.apiaryDateColumn)}, task_apiary.task_date
    ) ELSE NULL END
  `.as('task_apiary');
}

function taskSource(db: Database, task: StatisticTask) {
  const commonSelections = [
    'id',
    'date',
    'amount',
    'hive_id',
    'type_id',
    'user_id',
    'deleted',
  ] as const;

  switch (task) {
    case 'feed':
      return db
        .selectFrom('feeds')
        .select([
          sql<StatisticTask>`'feed'`.as('kind'),
          ...commonSelections,
          sql<number | null>`NULL`.as('frames'),
          sql<string | null>`NULL`.as('water'),
          sql<number | null>`NULL`.as('disease_id'),
        ])
        .$castTo<TaskSourceRow>();
    case 'harvest':
      return db
        .selectFrom('harvests')
        .select([
          sql<StatisticTask>`'harvest'`.as('kind'),
          ...commonSelections,
          'frames',
          'water',
          sql<number | null>`NULL`.as('disease_id'),
        ])
        .$castTo<TaskSourceRow>();
    case 'treatment':
      return db
        .selectFrom('treatments')
        .select([
          sql<StatisticTask>`'treatment'`.as('kind'),
          ...commonSelections,
          sql<number | null>`NULL`.as('frames'),
          sql<string | null>`NULL`.as('water'),
          'disease_id',
        ])
        .$castTo<TaskSourceRow>();
  }
}

function taskApiarySource(db: Database, task: StatisticTask) {
  const commonSelections = ['apiary_id', 'apiary_name', 'user_id'] as const;

  switch (task) {
    case 'feed':
      return db
        .selectFrom('feeds_apiaries')
        .select([
          sql<StatisticTask>`'feed'`.as('kind'),
          'feed_id as task_id',
          'feed_date as task_date',
          ...commonSelections,
        ])
        .$castTo<TaskApiarySourceRow>();
    case 'harvest':
      return db
        .selectFrom('harvests_apiaries')
        .select([
          sql<StatisticTask>`'harvest'`.as('kind'),
          'harvest_id as task_id',
          'harvest_date as task_date',
          ...commonSelections,
        ])
        .$castTo<TaskApiarySourceRow>();
    case 'treatment':
      return db
        .selectFrom('treatments_apiaries')
        .select([
          sql<StatisticTask>`'treatment'`.as('kind'),
          'treatment_id as task_id',
          'treatment_date as task_date',
          ...commonSelections,
        ])
        .$castTo<TaskApiarySourceRow>();
  }
}

function taskTypeSource(db: Database, task: StatisticTask) {
  const selections = [
    'id',
    'name',
    'favorite',
    'modus',
    'created_at',
    'updated_at',
    'user_id',
  ] as const;

  switch (task) {
    case 'feed':
      return db
        .selectFrom('feed_types')
        .select([sql<StatisticTask>`'feed'`.as('kind'), ...selections])
        .$castTo<TaskTypeSourceRow>();
    case 'harvest':
      return db
        .selectFrom('harvest_types')
        .select([sql<StatisticTask>`'harvest'`.as('kind'), ...selections])
        .$castTo<TaskTypeSourceRow>();
    case 'treatment':
      return db
        .selectFrom('treatment_types')
        .select([sql<StatisticTask>`'treatment'`.as('kind'), ...selections])
        .$castTo<TaskTypeSourceRow>();
  }
}

function buildTaskQuery(
  db: Database,
  task: StatisticTask,
  companyId: number,
  filters: StatisticFilter[],
  applyYear: boolean,
  defaultCurrentYear: boolean,
) {
  let query = db
    .selectFrom(taskSource(db, task).as('task'))
    .innerJoin('hives as hive', 'hive.id', 'task.hive_id')
    .leftJoin(taskApiarySource(db, task).as('task_apiary'), (join) =>
      join
        .onRef('task_apiary.task_id', '=', 'task.id')
        .onRef('task_apiary.kind', '=', 'task.kind'),
    )
    .leftJoin(taskTypeSource(db, task).as('task_type'), (join) =>
      join
        .onRef('task_type.id', '=', 'task.type_id')
        .onRef('task_type.kind', '=', 'task.kind'),
    )
    .where('task.kind', '=', task)
    .where('task.deleted', '=', false)
    .where('task.user_id', '=', companyId)
    .where('hive.deleted', '=', false);

  for (const filter of filters) {
    if (filter.kind === 'year' && applyYear) {
      query = query
        .where('task.date', '>=', new Date(`${filter.value}-01-01`))
        .where('task.date', '<=', new Date(`${filter.value}-12-31`));
    } else if (filter.kind === 'type') {
      query = query.where('task.type_id', '=', filter.value);
    } else if (filter.kind === 'disease' && task === 'treatment') {
      query = query.where('task.disease_id', '=', filter.value);
    } else if (filter.kind === 'hiveInclude') {
      query = query.where('task.hive_id', 'in', filter.value);
    } else if (filter.kind === 'hiveExclude') {
      query = query.where('task.hive_id', 'not in', filter.value);
    } else if (filter.kind === 'apiaryInclude') {
      query = query.where('task_apiary.apiary_id', 'in', filter.value);
    }
  }

  if (defaultCurrentYear && filters.length === 0) {
    const year = new Date().getFullYear();
    query = query
      .where('task.date', '>=', new Date(`${year}-01-01`))
      .where('task.date', '<=', new Date(`${year}-12-31`));
  }
  return query;
}

function taskMetricSelections(task: StatisticTask, hiveMode: boolean) {
  const amountSelections = [
    sql<string | null>`SUM(task.amount)`.as('amount_sum'),
    (hiveMode && task === 'harvest'
      ? sql<string | null>`AVG(task.amount)`
      : sql<string | null>`SUM(task.amount) / COUNT(DISTINCT task.hive_id)`
    ).as('amount_avg'),
  ];
  return task === 'harvest'
    ? [
        ...amountSelections,
        sql<string | null>`SUM(task.frames)`.as('frames_sum'),
        sql<string | null>`AVG(task.frames)`.as('frames_avg'),
        sql<string | null>`AVG(task.water)`.as('water_avg'),
      ]
    : amountSelections;
}

export async function listTaskStatisticsByHive(
  db: Database,
  companyId: number,
  task: StatisticTask,
  input: StatisticListQuery,
) {
  const filters = parseStatisticFilters(input.filters, task);
  const base = buildTaskQuery(db, task, companyId, filters, true, false);
  let grouped = base
    .select([
      sql<number | null>`YEAR(task.date)`.as('year'),
      'task.hive_id',
      ...taskMetricSelections(task, true),
      hiveProjection(),
      taskApiaryProjection(task),
    ])
    .groupBy(['task.hive_id', sql`YEAR(task.date)`]);

  if (input.groupByType) {
    grouped = grouped.select(taskTypeProjection()).groupBy('task.type_id');
  }
  const search = input.q === undefined ? '' : String(input.q).trim();
  if (search) {
    grouped = grouped.having(sql<boolean>`hive.name LIKE ${`%${search}%`}`);
  }

  const countResult = await db
    .selectFrom(grouped.as('statistics'))
    .select(sql<number | string>`COUNT(*)`.as('count'))
    .executeTakeFirstOrThrow();

  if (input.order) {
    const fields = Array.isArray(input.order) ? input.order : [input.order];
    fields.forEach((field, index) => {
      const direction = Array.isArray(input.direction)
        ? input.direction[index]
        : input.direction;
      grouped = grouped.orderBy(
        sql.ref(orderColumns[field]),
        direction ?? 'asc',
      );
    });
  }

  const page = input.offset ?? 0;
  const limit =
    input.limit === 0 || input.limit === undefined ? 10 : input.limit;
  const results = await grouped
    .orderBy('hive.name', 'asc')
    .limit(limit)
    .offset(page * limit)
    .execute();
  return { results, total: Number(countResult.count) };
}

export function listTaskStatisticsSummary(
  db: Database,
  companyId: number,
  task: StatisticTask,
  mode: TaskSummaryMode,
  input: StatisticSummaryQuery,
) {
  const filters = parseStatisticFilters(input.filters, task);
  const base = buildTaskQuery(
    db,
    task,
    companyId,
    filters,
    mode !== 'year',
    mode !== 'year' && !input.filters,
  );
  const selections = [
    sql<string | null>`COUNT(DISTINCT task.hive_id)`.as('hive_count'),
    ...taskMetricSelections(task, false),
    taskApiaryProjection(task),
  ];

  if (mode === 'year') {
    return base
      .select([sql<number | null>`YEAR(task.date)`.as('year'), ...selections])
      .groupBy(sql`YEAR(task.date)`)
      .orderBy('year', 'asc')
      .execute();
  }
  if (mode === 'apiary') {
    return base
      .select(selections)
      .groupBy('task_apiary.apiary_id')
      .orderBy('task_apiary.apiary_name', 'asc')
      .execute();
  }
  return base
    .select([...selections, taskTypeProjection()])
    .groupBy('task.type_id')
    .orderBy('task_type.name', 'asc')
    .execute();
}

export async function listHiveCountTotal(db: Database, companyId: number) {
  const hives = await db
    .selectFrom('hives')
    .innerJoin('movedates', 'movedates.hive_id', 'hives.id')
    .select([
      'hives.id',
      'hives.modus',
      'hives.modus_date',
      sql<Date | null>`MIN(movedates.date)`.as('first_movement'),
    ])
    .where('hives.deleted', '=', false)
    .where('hives.user_id', '=', companyId)
    .groupBy('hives.id')
    .execute();

  interface Change {
    year: number;
    quarter: number;
    ident: string;
    increase?: number;
    decrease?: number;
    user_id?: number;
  }
  const changes = new Map<string, Change>();
  const years: number[] = [];
  const addChange = (date: Date | string, field: 'increase' | 'decrease') => {
    const value = new Date(date);
    const year = value.getUTCFullYear();
    const quarter = Math.floor(value.getUTCMonth() / 3) + 1;
    const ident = `${year}${quarter}`;
    years.push(year);
    const change = changes.get(ident) ?? { year, quarter, ident };
    change[field] = (change[field] ?? 0) + 1;
    change.user_id = companyId;
    changes.set(ident, change);
  };

  for (const hive of hives) {
    if (hive.first_movement) addChange(hive.first_movement, 'increase');
    if (hive.modus === false && hive.modus_date) {
      addChange(hive.modus_date, 'decrease');
    }
  }
  if (years.length === 0) return [];

  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  let total = 0;
  const result = [];
  for (let year = minYear; year <= maxYear; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      const ident = `${year}${quarter}`;
      const change = changes.get(ident);
      const difference = (change?.increase ?? 0) - (change?.decrease ?? 0);
      total += difference;
      result.push({
        year,
        quarter,
        ident,
        ...(change?.increase !== undefined && {
          increase: String(change.increase),
        }),
        ...(change?.decrease !== undefined && {
          decrease: String(change.decrease),
        }),
        ...(change?.user_id !== undefined && { user_id: change.user_id }),
        change: difference,
        total,
      });
    }
  }
  return result;
}

export function listHiveCountByApiary(
  db: Database,
  companyId: number,
  date: Date,
) {
  const ranked = db
    .selectFrom('movedates as movement')
    .innerJoin('hives as hive', 'hive.id', 'movement.hive_id')
    .select([
      'movement.apiary_id',
      'movement.hive_id',
      sql<number>`IF(hive.grouphive > 0, hive.grouphive, 1)`.as('amount'),
      sql<number>`ROW_NUMBER() OVER (PARTITION BY movement.hive_id ORDER BY movement.date DESC, movement.id DESC)`.as(
        'rank',
      ),
    ])
    .where('hive.deleted', '=', false)
    .where('hive.user_id', '=', companyId)
    .where('movement.date', '<=', date)
    .where((expression) =>
      expression.or([
        expression('hive.modus', '=', true),
        expression.and([
          expression('hive.modus', '=', false),
          expression('hive.modus_date', '>=', date),
        ]),
      ]),
    )
    .as('latest');

  return db
    .selectFrom(ranked)
    .leftJoin('apiaries', 'apiaries.id', 'latest.apiary_id')
    .select([
      'latest.apiary_id',
      sql<number | string | null>`SUM(latest.amount)`.as('total'),
      'apiaries.user_id',
      'apiaries.name',
    ])
    .where('latest.rank', '=', 1)
    .groupBy('latest.apiary_id')
    .execute();
}

function ratingSelections() {
  return [
    sql<string | null>`AVG(NULLIF(checkup.brood, 0))`.as('brood'),
    sql<string | null>`AVG(NULLIF(checkup.pollen, 0))`.as('pollen'),
    sql<string | null>`AVG(NULLIF(checkup.comb, 0))`.as('comb'),
    sql<string | null>`AVG(NULLIF(checkup.temper, 0))`.as('temper'),
    sql<string | null>`AVG(NULLIF(checkup.calm_comb, 0))`.as('calm_comb'),
    sql<string | null>`AVG(NULLIF(checkup.swarm, 0))`.as('swarm'),
    sql<string | null>`AVG(NULLIF(checkup.varroa, 0))`.as('varroa'),
    sql<string | null>`AVG(NULLIF(checkup.strong, 0))`.as('strong'),
  ];
}

export async function listHiveRatingStatistics(
  db: Database,
  companyId: number,
  input: StatisticListQuery,
) {
  const filters = parseStatisticFilters(input.filters);
  let base = db
    .selectFrom('checkups as checkup')
    .innerJoin('hives as hive', 'hive.id', 'checkup.hive_id')
    .where('checkup.deleted', '=', false)
    .where('checkup.user_id', '=', companyId)
    .where('hive.deleted', '=', false);
  for (const filter of filters) {
    if (filter.kind === 'year') {
      base = base
        .where('checkup.date', '>=', new Date(`${filter.value}-01-01`))
        .where('checkup.date', '<=', new Date(`${filter.value}-12-31`));
    }
  }
  const search = input.q === undefined ? '' : String(input.q).trim();
  if (search) base = base.where('hive.name', 'like', `%${search}%`);

  let grouped = base
    .select([
      'checkup.hive_id',
      sql<number | null>`YEAR(checkup.date)`.as('year'),
      ...ratingSelections(),
      hiveProjection(),
    ])
    .groupBy(['checkup.hive_id', sql`YEAR(checkup.date)`])
    .having(
      sql<boolean>`(
        SUM(checkup.brood) + SUM(checkup.pollen) + SUM(checkup.comb) +
        SUM(checkup.temper) + SUM(checkup.calm_comb) + SUM(checkup.swarm) +
        SUM(checkup.varroa) + SUM(checkup.strong)
      ) > 0`,
    );
  const countResult = await db
    .selectFrom(grouped.as('statistics'))
    .select(sql<number | string>`COUNT(*)`.as('count'))
    .executeTakeFirstOrThrow();

  if (input.order) {
    const fields = Array.isArray(input.order) ? input.order : [input.order];
    fields.forEach((field, index) => {
      const direction = Array.isArray(input.direction)
        ? input.direction[index]
        : input.direction;
      grouped = grouped.orderBy(
        sql.ref(orderColumns[field]),
        direction ?? 'asc',
      );
    });
  }
  const page = input.offset ?? 0;
  const limit =
    input.limit === 0 || input.limit === undefined ? 10 : input.limit;
  const results = await grouped
    .orderBy('hive.name', 'asc')
    .limit(limit)
    .offset(page * limit)
    .execute();
  return { results, total: Number(countResult.count) };
}

function dateOnly(value: Date | string) {
  return new Date(value).toISOString().split('T')[0];
}

export async function getVarroaStatistics(
  db: Database,
  companyId: number,
  input: VarroaStatisticQuery,
) {
  const hiveIds = input.hive_ids.slice(0, 21);
  if (hiveIds.length === 0) {
    return { datasetCheckup: {}, datasetTreatment: {}, stats: [] };
  }
  const [checkups, treatments] = await Promise.all([
    db
      .selectFrom('checkups as checkup')
      .innerJoin('hives as hive', 'hive.id', 'checkup.hive_id')
      .leftJoin('checkup_types as type', 'type.id', 'checkup.type_id')
      .select([
        'checkup.hive_id',
        'checkup.varroa',
        'checkup.date',
        'type.name as type_name',
        'hive.name as hive_name',
      ])
      .where('checkup.deleted', '=', false)
      .where('checkup.user_id', '=', companyId)
      .where('hive.deleted', '=', false)
      .where('checkup.hive_id', 'in', hiveIds)
      .where('checkup.date', '>=', new Date(input.start_date))
      .where('checkup.date', '<=', new Date(input.end_date))
      .execute(),
    db
      .selectFrom('treatments as treatment')
      .innerJoin('hives as hive', 'hive.id', 'treatment.hive_id')
      .leftJoin('treatment_types as type', 'type.id', 'treatment.type_id')
      .select([
        'treatment.hive_id',
        'treatment.date',
        'treatment.amount',
        'type.name as type_name',
        'hive.name as hive_name',
      ])
      .where('treatment.deleted', '=', false)
      .where('treatment.user_id', '=', companyId)
      .where('hive.deleted', '=', false)
      .where('treatment.hive_id', 'in', hiveIds)
      .where('treatment.date', '>=', new Date(input.start_date))
      .where('treatment.date', '<=', new Date(input.end_date))
      .execute(),
  ]);

  const datasetCheckup: Record<
    string,
    Array<Array<string | number | null>>
  > = {};
  const datasetTreatment: Record<
    string,
    Array<Array<string | number | null>>
  > = {};
  const stats: Array<{
    hive_name: string;
    varroa: { min: number; max: number; avg: number };
  }> = [];

  for (const hiveId of hiveIds) {
    const rows = checkups.filter((row) => row.hive_id === hiveId);
    if (rows.length === 0) continue;
    const statistic = {
      hive_name: rows[0].hive_name ?? '',
      varroa: { min: 0, max: 0, avg: 0 },
    };
    let averageLength = 0;
    let average: number | string = 0;
    datasetCheckup[String(hiveId)] = rows.flatMap((row) => {
      if (row.date === null) return [];
      if (row.varroa !== null && Number(row.varroa) > 0) {
        const value = Number(row.varroa);
        averageLength++;
        statistic.varroa.min = Math.min(
          statistic.varroa.min === 0 ? value : statistic.varroa.min,
          value,
        );
        statistic.varroa.max = Math.max(statistic.varroa.max, value);
        average =
          typeof row.varroa === 'string'
            ? `${average}${row.varroa}`
            : Number(average) + row.varroa;
      }
      return [
        [hiveId, row.varroa, dateOnly(row.date), row.type_name, row.hive_name],
      ];
    });
    if (averageLength > 0) {
      statistic.varroa.avg =
        Math.round(
          (Number.parseFloat(`${average}`) / averageLength + Number.EPSILON) *
            100,
        ) / 100;
    }
    stats.push(statistic);
  }

  for (const hiveId of hiveIds) {
    const rows = treatments.filter((row) => row.hive_id === hiveId);
    if (rows.length === 0) continue;
    datasetTreatment[String(hiveId)] = rows.flatMap((row) =>
      row.date === null
        ? []
        : [
            [
              hiveId,
              row.amount,
              dateOnly(row.date),
              row.type_name,
              row.hive_name,
              0,
            ],
          ],
    );
  }
  return { datasetCheckup, datasetTreatment, stats };
}
