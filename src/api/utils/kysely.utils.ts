import type { ExpressionBuilder, Kysely, Transaction } from 'kysely';
import type { DB } from '../../types/db.types.js';
import { jsonObjectFrom } from 'kysely/helpers/postgres';

/**
 * Execute a function within a database transaction.
 * Automatically commits on success and rolls back on error.
 */
export async function transaction<T>(
  db: Kysely<DB>,
  callback: (trx: Transaction<DB>) => Promise<T>,
): Promise<T> {
  return await db.transaction().execute(callback);
}

/**
 * Pagination helper that returns paginated results with metadata
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  results: T[]
  total: number
  page: number
  limit: number
  pages: number
}

export async function paginate<T>(
  query: any,
  countQuery: any,
  params: PaginationParams = {},
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(Math.max(1, params.limit || 20), 100);
  const offset = (page - 1) * limit;

  const [results, countResult] = await Promise.all([
    query.limit(limit).offset(offset).execute(),
    countQuery.executeTakeFirst(),
  ]);

  const total = Number(countResult?.count || 0);
  const pages = Math.ceil(total / limit);

  return {
    results,
    total,
    page,
    limit,
    pages,
  };
}

/**
 * Add ordering to a query based on field and direction
 */
export function applyOrdering<QB>(
  query: QB,
  orderBy: string | string[],
  direction: 'asc' | 'desc' = 'asc',
): QB {
  if (Array.isArray(orderBy)) {
    let result = query;
    for (const field of orderBy) {
      result = (result as any).orderBy(field, direction);
    }
    return result;
  }
  return (query as any).orderBy(orderBy, direction);
}

/**
 * Soft delete helper - sets deleted = 1 and deleted_at = now
 */
export async function softDelete<TB extends keyof DB>(
  db: Kysely<DB>,
  table: TB,
  where: Partial<DB[TB]>,
): Promise<void> {
  let query = (db
    .updateTable(table) as any)
    .set({
      deleted: 1,
      deleted_at: new Date(),
    });

  for (const [key, value] of Object.entries(where)) {
    query = query.where(key as any, '=', value);
  }

  await query.execute();
}

/**
 * Build a jsonObjectFrom selection that fetches a single bee (creator/editor) by reference.
 * Keeps controller code DRY and ensures consistent payload shape.
 */
export function selectBeeJson(eb: ExpressionBuilder<DB, any>, options: { alias: string, columnRef: string }) {
  return jsonObjectFrom(
    eb
      .selectFrom('bees')
      .select(['bees.id as id', 'bees.email as email', 'bees.username as username'])
      .whereRef('bees.id', '=', options.columnRef)
      .limit(1),
  ).as(options.alias);
}
