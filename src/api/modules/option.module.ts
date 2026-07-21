import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { Database } from '../../types/database.types.js';
import type { DB } from '../../types/db.types.js';
import { optionTableSchema } from '../schemas/option.schema.js';
import type {
  OptionListQuery,
  OptionOrderField,
  OptionTable,
  OptionValues,
} from '../schemas/option.schema.js';

export const optionTables = optionTableSchema.options;

type CommonOptionTable = Exclude<
  OptionTable,
  'charge_types' | 'treatment_vets'
>;
type OptionOrderColumn =
  | 'id'
  | 'name'
  | 'favorite'
  | 'modus'
  | 'created_at'
  | 'updated_at';

const orderColumns: Record<OptionOrderField, OptionOrderColumn> = {
  id: 'id',
  name: 'name',
  favorite: 'favorite',
  modus: 'modus',
  created_at: 'created_at',
  updated_at: 'updated_at',
};

function commonValues(input: OptionValues) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.modus !== undefined && { modus: input.modus }),
    ...(input.favorite !== undefined && { favorite: input.favorite }),
  };
}

function applyListOptions<Output>(
  query: {
    where(column: 'modus', operator: '=', value: boolean): typeof query;
    orderBy(column: OptionOrderColumn, direction: 'asc' | 'desc'): typeof query;
    execute(): Promise<Output[]>;
  },
  input: OptionListQuery,
) {
  let result = query;
  if (input.modus !== undefined && input.modus !== null) {
    result = result.where('modus', '=', input.modus);
  }
  if (input.order) {
    const fields = Array.isArray(input.order) ? input.order : [input.order];
    fields.forEach((field, index) => {
      const direction = Array.isArray(input.direction)
        ? input.direction[index]
        : input.direction;
      result = result.orderBy(orderColumns[field], direction ?? 'asc');
    });
  }
  return result.execute();
}

function listCommonOptions(
  db: Database,
  table: CommonOptionTable,
  companyId: number,
  input: OptionListQuery,
) {
  const query = db
    .selectFrom(table)
    .selectAll()
    .where('user_id', '=', companyId);
  return applyListOptions(query, input);
}

function listChargeTypes(
  db: Database,
  companyId: number,
  input: OptionListQuery,
) {
  const query = db
    .selectFrom('charge_types')
    .leftJoin('charge_stocks', 'charge_stocks.type_id', 'charge_types.id')
    .selectAll('charge_types')
    .select(
      sql<Record<string, string | number | null> | null>`
        CASE WHEN charge_stocks.type_id IS NOT NULL THEN JSON_OBJECT(
          'sum', charge_stocks.sum,
          'sum_in', charge_stocks.sum_in,
          'sum_out', charge_stocks.sum_out,
          'type_id', charge_stocks.type_id,
          'user_id', charge_stocks.user_id
        ) ELSE NULL END
      `.as('stock'),
    )
    .where('charge_types.user_id', '=', companyId);
  return applyListOptions(query, input);
}

function listTreatmentVets(
  db: Database,
  companyId: number,
  input: OptionListQuery,
) {
  const query = db
    .selectFrom('treatment_vets')
    .selectAll()
    .where('user_id', '=', companyId);
  return applyListOptions(query, input);
}

export function listOptions(
  db: Database,
  table: OptionTable,
  companyId: number,
  input: OptionListQuery,
) {
  if (table === 'charge_types') {
    return listChargeTypes(db, companyId, input);
  }
  if (table === 'treatment_vets') {
    return listTreatmentVets(db, companyId, input);
  }
  return listCommonOptions(db, table, companyId, input);
}

export async function updateOptions(
  db: Database,
  table: OptionTable,
  companyId: number,
  ids: number[],
  input: OptionValues,
) {
  if (table === 'charge_types') {
    const result = await db
      .updateTable(table)
      .set({
        ...commonValues(input),
        ...(input.unit !== undefined && { unit: input.unit }),
      })
      .where('id', 'in', ids)
      .where('user_id', '=', companyId)
      .executeTakeFirst();
    return Number(result.numUpdatedRows);
  }
  if (table === 'treatment_vets') {
    const result = await db
      .updateTable(table)
      .set({
        ...commonValues(input),
        ...(input.note !== undefined && { note: input.note }),
      })
      .where('id', 'in', ids)
      .where('user_id', '=', companyId)
      .executeTakeFirst();
    return Number(result.numUpdatedRows);
  }
  const result = await db
    .updateTable(table)
    .set(commonValues(input))
    .where('id', 'in', ids)
    .where('user_id', '=', companyId)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}

export async function createOption(
  db: Kysely<DB>,
  table: OptionTable,
  companyId: number,
  input: OptionValues & { name: string },
) {
  return db.transaction().execute(async (trx) => {
    if (input.favorite === true) {
      await trx
        .updateTable(table)
        .set({ favorite: false })
        .where('user_id', '=', companyId)
        .execute();
    }

    if (table === 'charge_types') {
      const inserted = await trx
        .insertInto(table)
        .values({
          ...commonValues(input),
          unit: input.unit ?? null,
          user_id: companyId,
        })
        .executeTakeFirstOrThrow();
      return trx
        .selectFrom(table)
        .selectAll()
        .where('id', '=', Number(inserted.insertId))
        .executeTakeFirstOrThrow();
    }
    if (table === 'treatment_vets') {
      const inserted = await trx
        .insertInto(table)
        .values({
          ...commonValues(input),
          note: input.note ?? null,
          user_id: companyId,
        })
        .executeTakeFirstOrThrow();
      return trx
        .selectFrom(table)
        .selectAll()
        .where('id', '=', Number(inserted.insertId))
        .executeTakeFirstOrThrow();
    }
    const inserted = await trx
      .insertInto(table)
      .values({ ...commonValues(input), user_id: companyId })
      .executeTakeFirstOrThrow();
    return trx
      .selectFrom(table)
      .selectAll()
      .where('id', '=', Number(inserted.insertId))
      .executeTakeFirstOrThrow();
  });
}

export async function updateOptionStatus(
  db: Database,
  table: OptionTable,
  companyId: number,
  ids: number[],
  status: boolean,
) {
  const result = await db
    .updateTable(table)
    .set({ modus: status })
    .where('id', 'in', ids)
    .where('user_id', '=', companyId)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}

export function updateFavoriteOption(
  db: Kysely<DB>,
  table: OptionTable,
  companyId: number,
  ids: number[],
) {
  return db.transaction().execute(async (trx) => {
    await trx
      .updateTable(table)
      .set({ favorite: false })
      .where('user_id', '=', companyId)
      .execute();
    const result = await trx
      .updateTable(table)
      .set({ favorite: true })
      .where('id', 'in', ids)
      .where('user_id', '=', companyId)
      .executeTakeFirst();
    return Number(result.numUpdatedRows);
  });
}

export function getOptionsByIds(
  db: Database,
  table: OptionTable,
  companyId: number,
  ids: number[],
) {
  return db
    .selectFrom(table)
    .selectAll()
    .where('id', 'in', ids)
    .where('user_id', '=', companyId)
    .execute();
}

export async function deleteOptions(
  db: Database,
  table: OptionTable,
  companyId: number,
  ids: number[],
) {
  const result = await db
    .deleteFrom(table)
    .where('id', 'in', ids)
    .where('user_id', '=', companyId)
    .executeTakeFirst();
  return Number(result.numDeletedRows);
}
