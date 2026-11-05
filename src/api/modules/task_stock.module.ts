import httpErrors from 'http-errors';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { Database } from '../../types/database.types.js';
import type { DB } from '../../types/db.types.js';
import type { RecipeBody, RecipeTable } from '../schemas/option.schema.js';
import type { TaskStockLine } from '../schemas/task.schema.js';
import { lockChargeLedger } from './charge.module.js';
import { requireChargeTypeOwnership } from './ownership.module.js';
import type { TaskActor, TaskTable } from './task.module.js';

const taskLinkColumns = {
  feeds: 'feed_id',
  treatments: 'treatment_id',
  harvests: 'harvest_id',
  checkups: 'checkup_id',
} as const satisfies Record<TaskTable, string>;

const recipeTypeColumns = {
  feed_types: 'feed_type_id',
  treatment_types: 'treatment_type_id',
  harvest_types: 'harvest_type_id',
  checkup_types: 'checkup_type_id',
} as const satisfies Record<RecipeTable, string>;

const taskTypeTables = {
  feeds: 'feed_types',
  treatments: 'treatment_types',
  harvests: 'harvest_types',
  checkups: 'checkup_types',
} as const satisfies Record<TaskTable, RecipeTable>;

const maxChargeAmount = 99_999.99;

interface TaskState {
  id: number;
  type_id: number | null;
  amount: number | null;
  date: Date | null;
  done: boolean;
  deleted: boolean;
  deleted_at: Date | null;
}

interface Booking {
  task: TaskState;
  charge_type_id: number;
  kind: 'in' | 'out';
  amount: number;
}

function inTransaction<T>(db: Database, write: (trx: Database) => Promise<T>) {
  return db.isTransaction ? write(db) : db.transaction().execute(write);
}

function linkValues(table: TaskTable, taskId: number) {
  return {
    feed_id: table === 'feeds' ? taskId : null,
    treatment_id: table === 'treatments' ? taskId : null,
    harvest_id: table === 'harvests' ? taskId : null,
    checkup_id: table === 'checkups' ? taskId : null,
  };
}

function recipeTypeValues(table: RecipeTable, typeId: number) {
  return {
    feed_type_id: table === 'feed_types' ? typeId : null,
    treatment_type_id: table === 'treatment_types' ? typeId : null,
    harvest_type_id: table === 'harvest_types' ? typeId : null,
    checkup_type_id: table === 'checkup_types' ? typeId : null,
  };
}

async function taskStates(
  db: Database,
  table: TaskTable,
  companyId: number,
  ids: number[],
) {
  const states = new Map<number, TaskState>();
  if (ids.length === 0) return states;
  const rows = await db
    .selectFrom(table)
    .select([
      'id',
      'type_id',
      'date',
      'done',
      'deleted',
      'deleted_at',
      table === 'checkups'
        ? sql<null>`NULL`.as('amount')
        : sql<number | null>`CAST(amount AS DOUBLE)`.as('amount'),
    ])
    .where('id', 'in', ids)
    .where('user_id', '=', companyId)
    .execute();
  for (const row of rows) {
    states.set(row.id, {
      id: row.id,
      type_id: row.type_id,
      amount: row.amount,
      date: row.date,
      done: Boolean(row.done),
      deleted: Boolean(row.deleted),
      deleted_at: row.deleted_at,
    });
  }
  return states;
}

async function linkedTaskIds(db: Database, table: TaskTable, ids: number[]) {
  if (ids.length === 0) return new Set<number>();
  const column = taskLinkColumns[table];
  const rows = await db
    .selectFrom('charges')
    .select(sql<number>`${sql.ref(column)}`.as('task_id'))
    .where(column, 'in', ids)
    .execute();
  return new Set(rows.map((row) => row.task_id));
}

function roundAmount(value: number) {
  const amount = Math.round(value * 100) / 100;
  if (amount > maxChargeAmount) {
    throw httpErrors.BadRequest(
      `Stock booking amount ${amount} is above the maximum ${maxChargeAmount}`,
    );
  }
  return amount;
}

async function recipeBookings(
  db: Database,
  table: TaskTable,
  companyId: number,
  tasks: TaskState[],
) {
  const typeIds = [
    ...new Set(tasks.flatMap((task) => (task.type_id ? [task.type_id] : []))),
  ];
  if (typeIds.length === 0) return [];
  const column = recipeTypeColumns[taskTypeTables[table]];
  const lines = await db
    .selectFrom('task_type_stock_lines')
    .select([
      sql<number>`${sql.ref(column)}`.as('type_id'),
      'charge_type_id',
      'kind',
      'mode',
      sql<number>`CAST(factor AS DOUBLE)`.as('factor'),
    ])
    .where(column, 'in', typeIds)
    .where('user_id', '=', companyId)
    .orderBy('id')
    .execute();
  const bookings: Booking[] = [];
  for (const task of tasks) {
    for (const line of lines) {
      if (line.type_id !== task.type_id) continue;
      const quantity =
        line.mode === 'per_hive'
          ? line.factor
          : task.amount === null
            ? 0
            : line.factor * task.amount;
      const amount = roundAmount(quantity);
      if (amount <= 0) continue;
      bookings.push({
        task,
        charge_type_id: line.charge_type_id,
        kind: line.kind === 'in' ? 'in' : 'out',
        amount,
      });
    }
  }
  return bookings;
}

async function listBookings(
  db: Database,
  companyId: number,
  tasks: TaskState[],
  lines: TaskStockLine[],
) {
  for (const chargeTypeId of new Set(lines.map((line) => line.charge_type_id)))
    await requireChargeTypeOwnership(db, chargeTypeId, companyId);
  const bookings: Booking[] = [];
  for (const task of tasks) {
    for (const line of lines) {
      const amount = roundAmount(line.amount);
      if (amount <= 0) continue;
      bookings.push({
        task,
        charge_type_id: line.charge_type_id,
        kind: line.kind,
        amount,
      });
    }
  }
  return bookings;
}

/**
 * Replace the stock bookings of the given task rows. Done tasks book from
 * `lines` when given, otherwise from the recipe of their task type. Call it
 * inside a transaction after `lockChargeLedger`.
 */
export async function syncTaskStock(
  db: Database,
  table: TaskTable,
  actor: TaskActor,
  ids: number[],
  lines?: TaskStockLine[],
) {
  if (ids.length === 0) return;
  await db
    .deleteFrom('charges')
    .where(taskLinkColumns[table], 'in', ids)
    .where('user_id', '=', actor.companyId)
    .execute();
  const states = await taskStates(db, table, actor.companyId, ids);
  const tasks = [...states.values()].filter((task) => task.done);
  if (tasks.length === 0) return;
  const bookings =
    lines === undefined
      ? await recipeBookings(db, table, actor.companyId, tasks)
      : await listBookings(db, actor.companyId, tasks, lines);
  if (bookings.length === 0) return;
  // The task type name is the description of the booking.
  const typeIds = [...new Set(tasks.flatMap((task) => task.type_id ?? []))];
  const typeNames = new Map(
    typeIds.length === 0
      ? []
      : (
          await db
            .selectFrom(taskTypeTables[table])
            .select(['id', 'name'])
            .where('id', 'in', typeIds)
            .where('user_id', '=', actor.companyId)
            .execute()
        ).map((row) => [row.id, row.name]),
  );
  await db
    .insertInto('charges')
    .values(
      bookings.map((booking) => ({
        name:
          booking.task.type_id === null
            ? null
            : (typeNames.get(booking.task.type_id) ?? null),
        kind: booking.kind,
        type_id: booking.charge_type_id,
        amount: booking.amount,
        date: booking.task.date,
        deleted: booking.task.deleted,
        deleted_at: booking.task.deleted_at,
        user_id: actor.companyId,
        bee_id: actor.beeId,
        ...linkValues(table, booking.task.id),
        ...(actor.isLlm && { ai_created_at: new Date() }),
      })),
    )
    .execute();
}

/** Copy date and soft delete state of the tasks to their bookings. */
async function followTaskStock(
  db: Database,
  table: TaskTable,
  actor: TaskActor,
  ids: number[],
) {
  if (ids.length === 0) return;
  const link = sql.ref(`charges.${taskLinkColumns[table]}`);
  await sql`
    UPDATE charges
    INNER JOIN ${sql.table(table)} AS task ON task.id = ${link}
    SET charges.date = task.date,
      charges.deleted = task.deleted,
      charges.deleted_at = task.deleted_at,
      charges.edit_id = ${actor.beeId}
    WHERE charges.user_id = ${actor.companyId}
      AND ${link} IN (${sql.join(ids)})
  `.execute(db);
}

/** Lock the stock ledger before a task create runs. */
export function lockTaskStock(db: Database, actor: TaskActor) {
  return lockChargeLedger(db, actor.companyId);
}

/**
 * Run a task update and adjust the stock bookings of the changed rows:
 * - `lines` given: book from the list.
 * - `done` changed: book from the recipe, or remove the bookings.
 * - amount or type changed on a task with bookings: book from the recipe.
 * - only date or soft delete changed: the bookings follow.
 */
export function updateWithTaskStock<T>(
  db: Database,
  table: TaskTable,
  actor: TaskActor,
  ids: number[],
  lines: TaskStockLine[] | undefined,
  write: (trx: Database) => Promise<T>,
) {
  return inTransaction(db, async (trx) => {
    await lockChargeLedger(trx, actor.companyId);
    const before = await taskStates(trx, table, actor.companyId, ids);
    const result = await write(trx);
    const after = await taskStates(trx, table, actor.companyId, ids);
    const linked = await linkedTaskIds(trx, table, [...after.keys()]);
    const recalculate: number[] = [];
    const follow: number[] = [];
    for (const [id, now] of after) {
      const old = before.get(id);
      if (!old) continue;
      if (lines !== undefined || old.done !== now.done) {
        recalculate.push(id);
      } else if (!linked.has(id)) {
        continue;
      } else if (old.amount !== now.amount || old.type_id !== now.type_id) {
        recalculate.push(id);
      } else if (
        String(old.date) !== String(now.date) ||
        old.deleted !== now.deleted
      ) {
        follow.push(id);
      }
    }
    await syncTaskStock(trx, table, actor, recalculate, lines);
    await followTaskStock(trx, table, actor, follow);
    return result;
  });
}

/** Linked bookings per task id. */
export async function listTaskStock(
  db: Database,
  companyId: number,
  table: TaskTable,
  ids: number[],
) {
  const result = new Map<
    number,
    {
      id: number;
      charge_type_id: number | null;
      kind: string | null;
      amount: number | null;
    }[]
  >();
  if (ids.length === 0) return result;
  const column = taskLinkColumns[table];
  const rows = await db
    .selectFrom('charges')
    .select([
      'id',
      sql<number>`${sql.ref(column)}`.as('task_id'),
      'type_id as charge_type_id',
      'kind',
      sql<number | null>`CAST(amount AS DOUBLE)`.as('amount'),
    ])
    .where(column, 'in', ids)
    .where('user_id', '=', companyId)
    .orderBy('id')
    .execute();
  for (const { task_id, ...charge } of rows) {
    result.set(task_id, [...(result.get(task_id) ?? []), charge]);
  }
  return result;
}

/** Add the linked bookings to task rows as `charges`. */
export async function withTaskStock<R extends { id: number }>(
  db: Database,
  companyId: number,
  table: TaskTable,
  rows: R[],
) {
  const stock = await listTaskStock(
    db,
    companyId,
    table,
    rows.map((row) => row.id),
  );
  return rows.map((row) => ({ ...row, charges: stock.get(row.id) ?? [] }));
}

/** Booked stock of the tasks, summed per charge type and direction. */
export function summarizeTaskStock(
  db: Database,
  companyId: number,
  table: TaskTable,
  ids: number[],
) {
  if (ids.length === 0) return Promise.resolve([]);
  return db
    .selectFrom('charges')
    .leftJoin('charge_types', 'charge_types.id', 'charges.type_id')
    .select([
      'charges.type_id as charge_type_id',
      'charge_types.name',
      'charge_types.unit',
      'charges.kind',
      sql<number>`CAST(SUM(charges.amount) AS DOUBLE)`.as('amount'),
      sql<number>`COUNT(charges.id)`.as('rows'),
    ])
    .where(`charges.${taskLinkColumns[table]}`, 'in', ids)
    .where('charges.user_id', '=', companyId)
    .where('charges.deleted', '=', false)
    .groupBy([
      'charges.type_id',
      'charge_types.name',
      'charge_types.unit',
      'charges.kind',
    ])
    .execute();
}

export function listRecipeLines(
  db: Database,
  companyId: number,
  table: RecipeTable,
  typeId?: number,
) {
  const column = recipeTypeColumns[table];
  let query = db
    .selectFrom('task_type_stock_lines')
    .select([
      'id',
      sql<number>`${sql.ref(column)}`.as('type_id'),
      'charge_type_id',
      sql<'in' | 'out'>`kind`.as('kind'),
      sql<'per_amount' | 'per_hive'>`mode`.as('mode'),
      sql<number>`CAST(factor AS DOUBLE)`.as('factor'),
    ])
    .where('user_id', '=', companyId)
    .where(column, 'is not', null);
  if (typeId !== undefined) query = query.where(column, '=', typeId);
  return query.orderBy('id').execute();
}

export function replaceRecipeLines(
  db: Kysely<DB>,
  companyId: number,
  table: RecipeTable,
  typeId: number,
  body: RecipeBody,
) {
  return db.transaction().execute(async (trx) => {
    const type = await trx
      .selectFrom(table)
      .select('id')
      .where('id', '=', typeId)
      .where('user_id', '=', companyId)
      .executeTakeFirst();
    if (!type) throw httpErrors.NotFound();
    if (
      table === 'checkup_types' &&
      body.lines.some((line) => line.mode !== 'per_hive')
    ) {
      throw httpErrors.BadRequest(
        'Checkup types have no amount; use mode per_hive',
      );
    }
    for (const chargeTypeId of new Set(
      body.lines.map((line) => line.charge_type_id),
    ))
      await requireChargeTypeOwnership(trx, chargeTypeId, companyId);
    await trx
      .deleteFrom('task_type_stock_lines')
      .where(recipeTypeColumns[table], '=', typeId)
      .where('user_id', '=', companyId)
      .execute();
    if (body.lines.length > 0) {
      await trx
        .insertInto('task_type_stock_lines')
        .values(
          body.lines.map((line) => ({
            ...recipeTypeValues(table, typeId),
            charge_type_id: line.charge_type_id,
            kind: line.kind,
            mode: line.mode,
            factor: line.factor,
            user_id: companyId,
          })),
        )
        .execute();
    }
    return listRecipeLines(trx, companyId, table, typeId);
  });
}
