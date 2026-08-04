import dayjs from 'dayjs';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { Database } from '../../types/database.types.js';
import type { DB } from '../../types/db.types.js';

export type TaskTable = 'feeds' | 'harvests' | 'treatments' | 'checkups';

interface NamedRelationResponse {
  [key: string]: unknown;
  id: number;
  name: string;
}

interface OptionResponse {
  [key: string]: unknown;
  id: number;
}

interface TaskApiaryResponse {
  [key: string]: unknown;
  apiary_id: number;
  apiary_name: string;
}

export interface TaskActor {
  companyId: number;
  beeId: number;
  isLlm: boolean;
}

export interface TaskFilter {
  field: string;
  value?: number;
  values?: number[];
  from?: Date;
  to?: Date;
}

export function parseTaskFilters(value?: string | null): TaskFilter[] {
  if (!value) return [];
  const result: TaskFilter[] = [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return result;
    for (const filter of parsed) {
      if (!filter || typeof filter !== 'object') continue;
      const candidate = filter as Record<string, unknown>;
      if (candidate.date && typeof candidate.date === 'object') {
        const date = candidate.date as Record<string, unknown>;
        if (typeof date.from === 'string' && typeof date.to === 'string') {
          result.push({
            field: 'date',
            from: new Date(date.from),
            to: new Date(date.to),
          });
        }
        continue;
      }
      for (const [field, rawValue] of Object.entries(candidate)) {
        if (Array.isArray(rawValue)) {
          const values = rawValue.map(Number).filter(Number.isFinite);
          if (values.length > 0) result.push({ field, values });
          continue;
        }
        const value = Number(rawValue);
        if (Number.isFinite(value)) result.push({ field, value });
      }
    }
  } catch {
    return result;
  }
  return result;
}

export function taskOrderings(
  order: string | string[] | null | undefined,
  direction:
    | 'asc'
    | 'desc'
    | 'ASC'
    | 'DESC'
    | ('asc' | 'desc' | 'ASC' | 'DESC')[]
    | null
    | undefined,
  columns: Readonly<Record<string, string>>,
) {
  if (!order) return [];
  const fields = Array.isArray(order) ? order : [order];
  return fields.flatMap((field, index) => {
    const column = columns[field];
    if (!column) return [];
    const selectedDirection = Array.isArray(direction)
      ? direction[index]
      : direction;
    return [
      {
        column,
        direction:
          selectedDirection?.toLowerCase() === 'desc'
            ? ('desc' as const)
            : ('asc' as const),
      },
    ];
  });
}

export function taskPagination(limit?: number | null, offset?: number | null) {
  const selectedLimit =
    limit === 0 || limit === undefined || limit === null ? 10 : limit;
  return { limit: selectedLimit, offset: (offset ?? 0) * selectedLimit };
}

export function hiveProjection() {
  return sql<NamedRelationResponse | null>`
    CASE WHEN hives.id IS NOT NULL THEN JSON_OBJECT(
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
    ) ELSE NULL END
  `.as('hive');
}

export function optionProjection(
  alias:
    | 'feed_types'
    | 'harvest_types'
    | 'treatment_types'
    | 'treatment_diseases'
    | 'treatment_vets'
    | 'checkup_types',
  output: 'type' | 'disease' | 'vet',
) {
  return sql<OptionResponse | null>`
    CASE WHEN ${sql.ref(`${alias}.id`)} IS NOT NULL THEN JSON_OBJECT(
      'id', ${sql.ref(`${alias}.id`)},
      'name', ${sql.ref(`${alias}.name`)},
      'favorite', IF(${sql.ref(`${alias}.favorite`)} = 1, TRUE, FALSE),
      'modus', IF(${sql.ref(`${alias}.modus`)} = 1, TRUE, FALSE),
      'user_id', ${sql.ref(`${alias}.user_id`)},
      'created_at', ${sql.ref(`${alias}.created_at`)},
      'updated_at', ${sql.ref(`${alias}.updated_at`)}
    ) ELSE NULL END
  `.as(output);
}

export function taskApiaryProjection(
  alias:
    | 'feeds_apiaries'
    | 'harvests_apiaries'
    | 'treatments_apiaries'
    | 'checkups_apiaries',
  idColumn: 'feed_id' | 'harvest_id' | 'treatment_id' | 'checkup_id',
  dateColumn: 'feed_date' | 'harvest_date' | 'treatment_date' | 'checkup_date',
  output:
    | 'feed_apiary'
    | 'harvest_apiary'
    | 'treatment_apiary'
    | 'checkup_apiary',
) {
  return sql<TaskApiaryResponse | null>`
    CASE WHEN ${sql.ref(`${alias}.${idColumn}`)} IS NOT NULL THEN JSON_OBJECT(
      'apiary_id', ${sql.ref(`${alias}.apiary_id`)},
      'apiary_name', ${sql.ref(`${alias}.apiary_name`)},
      'user_id', ${sql.ref(`${alias}.user_id`)},
      ${sql.lit(idColumn)}, ${sql.ref(`${alias}.${idColumn}`)},
      ${sql.lit(dateColumn)}, ${sql.ref(`${alias}.${dateColumn}`)}
    ) ELSE NULL END
  `.as(output);
}

export async function ownedHiveIds(
  db: Database,
  companyId: number,
  hiveIds: number[],
) {
  const rows = await db
    .selectFrom('hives')
    .select('id')
    .where('id', 'in', hiveIds)
    .where('user_id', '=', companyId)
    .execute();
  return rows.map((row) => row.id);
}

export function taskSchedule(
  date: string,
  enddate: string | null | undefined,
  interval: number,
  repeat: number,
) {
  const normalizedEnd =
    !enddate || dayjs(enddate).isBefore(dayjs(date)) ? date : enddate;
  return Array.from({ length: repeat + 1 }, (_, index) => ({
    date: new Date(
      dayjs(date)
        .add(interval * index, 'days')
        .format('YYYY-MM-DD'),
    ),
    enddate: new Date(
      dayjs(normalizedEnd)
        .add(interval * index, 'days')
        .format('YYYY-MM-DD'),
    ),
  }));
}

export async function updateTaskStatus(
  db: Database,
  table: TaskTable,
  actor: TaskActor,
  ids: number[],
  status: boolean,
) {
  const result = await db
    .updateTable(table)
    .set({ edit_id: actor.beeId, done: status })
    .where('id', 'in', ids)
    .where('user_id', '=', actor.companyId)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}

export async function updateTaskDates(
  db: Database,
  table: TaskTable,
  actor: TaskActor,
  ids: number[],
  start: string,
  end: string,
) {
  const result = await db
    .updateTable(table)
    .set({
      edit_id: actor.beeId,
      date: new Date(start),
      enddate: new Date(end),
    })
    .where('id', 'in', ids)
    .where('user_id', '=', actor.companyId)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}

export function deleteTasks(
  db: Kysely<DB>,
  table: TaskTable,
  actor: TaskActor,
  ids: number[],
  options: { hard: boolean; restore: boolean },
) {
  return db.transaction().execute(async (transaction) => {
    const rows = await transaction
      .selectFrom(table)
      .select(['id', 'deleted'])
      .where('id', 'in', ids)
      .where('user_id', '=', actor.companyId)
      .execute();
    const softIds: number[] = [];
    const hardIds: number[] = [];
    for (const row of rows) {
      if ((row.deleted || options.hard) && !options.restore)
        hardIds.push(row.id);
      else softIds.push(row.id);
    }
    if (hardIds.length > 0) {
      await transaction.deleteFrom(table).where('id', 'in', hardIds).execute();
    }
    if (softIds.length > 0) {
      await transaction
        .updateTable(table)
        .set({ deleted: !options.restore, edit_id: actor.beeId })
        .where('id', 'in', softIds)
        .execute();
    }
    return rows;
  });
}
