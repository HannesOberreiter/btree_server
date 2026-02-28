import type { Kysely, SelectQueryBuilder, Transaction } from 'kysely';

import type { DB } from '../../types/db.types.js';

import { sql } from 'kysely';
import { KyselyServer } from '../../servers/kysely.server.js';

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
 * Add creator and editor relations to a query.
 * Adds LEFT JOINs and JSON_OBJECT selections for bee (user) relations.
 */
export function withCreatorAndEditor<TB extends keyof DB & string, O>(
  query: SelectQueryBuilder<DB, TB, O>,
  options: {
    creatorColumn: string
    editorColumn: string
  },
): SelectQueryBuilder<
DB & { creator: DB['bees'] | null, editor: DB['bees'] | null },
TB | 'creator' | 'editor',
O & {
  creator: { id: number, email: string, username: string } | null
  editor: { id: number, email: string, username: string } | null
}
> {
  return query
    // @ts-expect-error - Dynamic column reference requires runtime validation
    .leftJoin('bees as creator', 'creator.id', sql.ref(options.creatorColumn))
    // @ts-expect-error - Dynamic column reference requires runtime validation
    .leftJoin('bees as editor', 'editor.id', sql.ref(options.editorColumn))
    .select([
      sql<{ id: number, email: string, username: string } | null>`
        CASE WHEN creator.id IS NOT NULL THEN
          JSON_OBJECT('id', creator.id, 'email', creator.email, 'username', creator.username)
        ELSE NULL END
      `.as('creator'),
      sql<{ id: number, email: string, username: string } | null>`
        CASE WHEN editor.id IS NOT NULL THEN
          JSON_OBJECT('id', editor.id, 'email', editor.email, 'username', editor.username)
        ELSE NULL END
      `.as('editor'),
    ]) as any;
}

/**
 * Add apiary relation to a query for todos.
 * Adds LEFT JOIN with apiaries table and JSON_OBJECT selection for apiary data.
 * Filters out soft-deleted apiaries.
 */
export function withApiary<TB extends keyof DB & string, O>(
  query: SelectQueryBuilder<DB, TB, O>,
  options: {
    apiaryColumn: string
  },
): SelectQueryBuilder<
DB & { apiaries: DB['apiaries'] | null },
TB | 'apiaries',
O & {
  apiary: { name: string, modus: boolean } | null
}
> {
  return query
    // @ts-expect-error - Dynamic column reference requires runtime validation
    .leftJoin('apiaries', 'apiaries.id', sql.ref(options.apiaryColumn))
    .select([
      sql<{ name: string, modus: boolean } | null>`
        CASE 
          WHEN apiaries.id IS NOT NULL THEN JSON_OBJECT('name', apiaries.name, 'modus', IF(apiaries.modus = 1, TRUE, FALSE))
          ELSE NULL
        END
      `.as('apiary'),
    ])
    // @ts-expect-error - Dynamic SQL expression for filtering soft-deleted apiaries
    .where(sql`(${sql.ref(options.apiaryColumn)} IS NULL OR apiaries.deleted = 0)`) as any;
}

/**
 * Tables that have a user_id column for ownership checks
 */
export type TableWithUserId = {
  [K in keyof DB]: 'user_id' extends keyof DB[K] ? K : never
}[keyof DB];

/**
 * Check if a record in a table belongs to a specific user (company).
 * Throws an error if the record doesn't exist or doesn't belong to the user.
 * Useful for validating foreign key references before insert/update operations.
 *
 * @example
 * // Check if apiary belongs to user before creating a todo
 * await checkOwnership(
 *   db,
 *   'apiaries',
 *   apiaryId,
 *   req.session.user.user_id
 * );
 *
 * @param db - Kysely database instance or transaction
 * @param table - Table name to check (must have user_id column)
 * @param recordId - ID of the record to check
 * @param userId - User (company) ID to verify ownership against
 * @throws Error if record doesn't exist or doesn't belong to user
 */
export async function checkOwnership(
  db = KyselyServer.getInstance().db,
  table: TableWithUserId,
  recordId: number,
  userId: number,
): Promise<void> {
  const record = await db
    .selectFrom(table)
    .select(['id', 'user_id'])
    .where('id', '=', recordId)
    .where('user_id', '=', userId)
    .executeTakeFirst();

  if (!record) {
    throw new Error(`Record with id ${recordId} not found in table ${table} for user ${userId}`);
  }
}
