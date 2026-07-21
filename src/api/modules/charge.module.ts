import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { Database } from '../../types/database.types.js';
import type { DB } from '../../types/db.types.js';
import type {
  ChargeBatchUpdateBody,
  ChargeCreateBody,
  ChargeListQuery,
  ChargeStockQuery,
} from '../schemas/charge.schema.js';
import { checkOwnership } from '../utils/kysely.utils.js';

const chargeOrder = {
  id: 'charges.id',
  date: 'charges.date',
  bestbefore: 'charges.bestbefore',
  name: 'charges.name',
  charge: 'charges.charge',
  amount: 'charges.amount',
  price: 'charges.price',
  created_at: 'charges.created_at',
  updated_at: 'charges.updated_at',
} as const;
const stockOrder = {
  id: 'charge_stocks.type_id',
  name: 'charge_types.name',
  unit: 'charge_types.unit',
  sum: 'charge_stocks.sum',
  sum_in: 'charge_stocks.sum_in',
  sum_out: 'charge_stocks.sum_out',
} as const;

function direction(value: unknown): 'asc' | 'desc' {
  return String(value).toLowerCase() === 'desc' ? 'desc' : 'asc';
}

function applyOrder<Q>(
  query: Q,
  order: unknown,
  directions: unknown,
  allowed: Record<string, string>,
): Q {
  const fields = Array.isArray(order) ? order : order ? [order] : [];
  const dirs = Array.isArray(directions) ? directions : [directions];
  let result = query;
  fields.forEach((field, index) => {
    const column = allowed[String(field)];
    if (column)
      result = (
        result as Q & {
          orderBy: (field: string, direction: 'asc' | 'desc') => Q;
        }
      ).orderBy(column, direction(dirs[index]));
  });
  return result;
}

function chargeProjection() {
  return [
    sql<{
      id: number;
      name: string;
      unit: string | null;
      modus: boolean;
      favorite: boolean;
      stock: Record<string, unknown> | null;
    } | null>`CASE WHEN charge_types.id IS NULL THEN NULL ELSE JSON_OBJECT('id', charge_types.id, 'name', charge_types.name, 'unit', charge_types.unit, 'modus', IF(charge_types.modus = 1, TRUE, FALSE), 'favorite', IF(charge_types.favorite = 1, TRUE, FALSE), 'stock', CASE WHEN charge_stocks.type_id IS NULL THEN NULL ELSE JSON_OBJECT('sum', charge_stocks.sum, 'sum_in', charge_stocks.sum_in, 'sum_out', charge_stocks.sum_out) END) END`.as(
      'type',
    ),
    sql<Record<
      string,
      unknown
    > | null>`CASE WHEN creator.id IS NULL THEN NULL ELSE JSON_OBJECT('email', creator.email, 'username', creator.username) END`.as(
      'creator',
    ),
    sql<Record<
      string,
      unknown
    > | null>`CASE WHEN editor.id IS NULL THEN NULL ELSE JSON_OBJECT('email', editor.email, 'username', editor.username) END`.as(
      'editor',
    ),
  ] as const;
}

function selectCharges(db: Database, companyId: number) {
  return db
    .selectFrom('charges')
    .leftJoin('charge_types', 'charge_types.id', 'charges.type_id')
    .leftJoin('charge_stocks', (join) =>
      join
        .onRef('charge_stocks.type_id', '=', 'charges.type_id')
        .on('charge_stocks.user_id', '=', companyId),
    )
    .leftJoin('bees as creator', 'creator.id', 'charges.bee_id')
    .leftJoin('bees as editor', 'editor.id', 'charges.edit_id')
    .selectAll('charges')
    .select(chargeProjection())
    .where('charges.user_id', '=', companyId);
}

export async function listCharges(
  db: Database,
  companyId: number,
  input: ChargeListQuery,
) {
  const limit = input.limit === 0 || !input.limit ? 10 : input.limit;
  const offset = input.offset ?? 0;
  let query = selectCharges(db, companyId).where(
    'charges.deleted',
    '=',
    input.deleted === true,
  );
  let count = db
    .selectFrom('charges')
    .select(db.fn.countAll<number>().as('total'))
    .where('user_id', '=', companyId)
    .where('deleted', '=', input.deleted === true);
  if (input.q !== undefined && String(input.q).trim()) {
    const search = `%${String(input.q)}%`;
    query = query.where((eb) =>
      eb.or([
        eb('charge_types.name', 'like', search),
        eb('charges.name', 'like', search),
        eb('charges.charge', 'like', search),
      ]),
    );
    count = count
      .leftJoin('charge_types', 'charge_types.id', 'charges.type_id')
      .where((eb) =>
        eb.or([
          eb('charge_types.name', 'like', search),
          eb('charges.name', 'like', search),
          eb('charges.charge', 'like', search),
        ]),
      );
  }
  if (input.filters) {
    try {
      const filters: unknown = JSON.parse(input.filters);
      if (Array.isArray(filters))
        for (const filter of filters) {
          if (typeof filter !== 'object' || filter === null) continue;
          const value = filter as Record<string, unknown>;
          if (
            typeof value.bestbefore === 'object' &&
            value.bestbefore !== null
          ) {
            const range = value.bestbefore as Record<string, string>;
            query = query
              .where('charges.bestbefore', '>=', new Date(range.from))
              .where('charges.bestbefore', '<=', new Date(range.to));
            count = count
              .where('charges.bestbefore', '>=', new Date(range.from))
              .where('charges.bestbefore', '<=', new Date(range.to));
          }
        }
    } catch {
      /* preserve ignored malformed filters */
    }
  }
  query = applyOrder(query, input.order, input.direction, chargeOrder).orderBy(
    'charges.id',
  );
  const [results, total] = await Promise.all([
    query
      .limit(limit)
      .offset(offset * limit)
      .execute(),
    count.executeTakeFirstOrThrow(),
  ]);
  return {
    results: results.map((row) => ({
      ...row,
      kind: row.kind ?? '',
      amount: row.amount === null ? null : Number(row.amount),
      price: row.price === null ? null : Number(row.price),
    })),
    total: total.total,
  };
}

export async function listChargeStock(
  db: Database,
  companyId: number,
  input: ChargeStockQuery,
) {
  const limit = input.limit === 0 || !input.limit ? 10 : input.limit;
  const offset = input.offset ?? 0;
  let query = db
    .selectFrom('charge_stocks')
    .innerJoin('charge_types', 'charge_types.id', 'charge_stocks.type_id')
    .select([
      'charge_types.id',
      'charge_types.name',
      'charge_types.unit',
      'charge_stocks.sum',
      'charge_stocks.sum_in',
      'charge_stocks.sum_out',
    ])
    .where('charge_stocks.user_id', '=', companyId)
    .where('charge_types.modus', '=', true);
  let count = db
    .selectFrom('charge_stocks')
    .innerJoin('charge_types', 'charge_types.id', 'charge_stocks.type_id')
    .select(db.fn.countAll<number>().as('total'))
    .where('charge_stocks.user_id', '=', companyId)
    .where('charge_types.modus', '=', true);
  if (input.q !== undefined && String(input.q).trim()) {
    const search = `%${String(input.q)}%`;
    query = query.where('charge_types.name', 'like', search);
    count = count.where('charge_types.name', 'like', search);
  }
  query = applyOrder(query, input.order, input.direction, stockOrder).orderBy(
    'charge_stocks.type_id',
  );
  const [results, total] = await Promise.all([
    query
      .limit(limit)
      .offset(offset * limit)
      .execute(),
    count.executeTakeFirstOrThrow(),
  ]);
  return { results, total: total.total };
}

export async function createCharge(
  db: Kysely<DB>,
  companyId: number,
  beeId: number,
  body: ChargeCreateBody,
  isLlm: boolean,
) {
  if (body.type_id)
    await checkOwnership(db, 'charge_types', body.type_id, companyId);
  const result = await db
    .insertInto('charges')
    .values({
      kind: body.kind,
      date: body.date ? new Date(body.date) : undefined,
      bestbefore:
        body.bestbefore === null
          ? null
          : body.bestbefore
            ? new Date(body.bestbefore)
            : undefined,
      name: body.name,
      charge: body.charge,
      price: body.price,
      amount: body.amount,
      url: body.url,
      type_id: body.type_id,
      note: body.note,
      user_id: companyId,
      bee_id: beeId,
      ...(isLlm && { ai_created_at: new Date() }),
    })
    .executeTakeFirstOrThrow();
  return [Number(result.insertId)];
}

export async function updateCharges(
  db: Database,
  companyId: number,
  beeId: number,
  body: ChargeBatchUpdateBody,
  isLlm: boolean,
) {
  if (body.data.type_id)
    await checkOwnership(db, 'charge_types', body.data.type_id, companyId);
  const result = await db
    .updateTable('charges')
    .set({
      ...(body.data.kind !== undefined && { kind: body.data.kind }),
      ...(body.data.date !== undefined && {
        date: body.data.date ? new Date(body.data.date) : null,
      }),
      ...(body.data.bestbefore !== undefined && {
        bestbefore: body.data.bestbefore
          ? new Date(body.data.bestbefore)
          : null,
      }),
      ...(body.data.name !== undefined && { name: body.data.name }),
      ...(body.data.charge !== undefined && { charge: body.data.charge }),
      ...(body.data.price !== undefined && { price: body.data.price }),
      ...(body.data.amount !== undefined && { amount: body.data.amount }),
      ...(body.data.url !== undefined && { url: body.data.url }),
      ...(body.data.type_id !== undefined && { type_id: body.data.type_id }),
      ...(body.data.note !== undefined && { note: body.data.note }),
      edit_id: beeId,
      ...(isLlm && { ai_updated_at: new Date() }),
    })
    .where('user_id', '=', companyId)
    .where('id', 'in', body.ids)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}

export async function getChargesByIds(
  db: Database,
  companyId: number,
  ids: number[],
) {
  const rows = await db
    .selectFrom('charges')
    .selectAll()
    .where('user_id', '=', companyId)
    .where('id', 'in', ids)
    .execute();
  return rows.map((row) => ({
    ...row,
    kind: row.kind ?? '',
    amount: row.amount === null ? null : Number(row.amount),
    price: row.price === null ? null : Number(row.price),
  }));
}

export async function deleteCharges(
  db: Kysely<DB>,
  companyId: number,
  beeId: number,
  ids: number[],
  hard: boolean,
  restore: boolean,
) {
  return db.transaction().execute(async (trx) => {
    const rows = await trx
      .selectFrom('charges')
      .selectAll()
      .where('user_id', '=', companyId)
      .where('id', 'in', ids)
      .execute();
    const hardIds = rows
      .filter((row) => (row.deleted || hard) && !restore)
      .map((row) => row.id);
    const softIds = rows
      .filter((row) => !hardIds.includes(row.id))
      .map((row) => row.id);
    if (hardIds.length)
      await trx.deleteFrom('charges').where('id', 'in', hardIds).execute();
    if (softIds.length)
      await trx
        .updateTable('charges')
        .set({
          deleted: !restore,
          deleted_at: sql<Date>`UTC_TIMESTAMP()`,
          edit_id: beeId,
        })
        .where('id', 'in', softIds)
        .execute();
    return rows.map((row) => ({
      ...row,
      kind: row.kind ?? '',
      amount: row.amount === null ? null : Number(row.amount),
      price: row.price === null ? null : Number(row.price),
    }));
  });
}
