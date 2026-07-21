import dayjs from 'dayjs';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { Database } from '../../types/database.types.js';
import type { DB } from '../../types/db.types.js';
import type {
  TodoBatchDelete,
  TodoBatchGet,
  TodoBatchUpdate,
  TodoCreate,
  TodoListQuery,
  TodoOrderField,
  TodoUpdateDate,
  TodoUpdateStatus,
} from '../schemas/todo.schema.js';
import { checkOwnership } from '../utils/kysely.utils.js';
import { insertTimestamps, updateTimestamp } from '../utils/timestamp.util.js';

export interface TodoActor {
  beeId: number;
  companyId: number;
  isLlm: boolean;
}

type TodoOrderColumn =
  | 'todos.id'
  | 'todos.date'
  | 'todos.name'
  | 'apiaries.name'
  | 'todos.url'
  | 'todos.note'
  | 'todos.done'
  | 'todos.created_at'
  | 'todos.updated_at';

const orderColumns: Record<TodoOrderField, TodoOrderColumn> = {
  id: 'todos.id',
  date: 'todos.date',
  name: 'todos.name',
  apiary: 'apiaries.name',
  url: 'todos.url',
  note: 'todos.note',
  done: 'todos.done',
  created_at: 'todos.created_at',
  updated_at: 'todos.updated_at',
};

interface DateRangeFilter {
  date: { from: string; to: string };
}

type TodoValueFilter =
  | { id: number }
  | { name: string }
  | { note: string }
  | { url: string }
  | { done: boolean }
  | { apiary_id: number };

type TodoFilter = DateRangeFilter | TodoValueFilter;

function parseFilters(value?: string): TodoFilter[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((filter): TodoFilter[] => {
      if (!filter || typeof filter !== 'object') return [];
      const candidate = filter as Record<string, unknown>;
      const date = candidate.date;
      if (date && typeof date === 'object') {
        const range = date as Record<string, unknown>;
        if (typeof range.from === 'string' && typeof range.to === 'string') {
          return [{ date: { from: range.from, to: range.to } }];
        }
      }
      if (typeof candidate.id === 'number') return [{ id: candidate.id }];
      if (typeof candidate.name === 'string') return [{ name: candidate.name }];
      if (typeof candidate.note === 'string') return [{ note: candidate.note }];
      if (typeof candidate.url === 'string') return [{ url: candidate.url }];
      if (typeof candidate.done === 'boolean')
        return [{ done: candidate.done }];
      if (typeof candidate.apiary_id === 'number')
        return [{ apiary_id: candidate.apiary_id }];
      return [];
    });
  } catch {
    return [];
  }
}

function actorProjection(alias: 'creator' | 'editor') {
  return sql<{
    id: number;
    email: string | null;
    username: string | null;
  } | null>`
    CASE WHEN ${sql.ref(`${alias}.id`)} IS NOT NULL THEN
      JSON_OBJECT(
        'id', ${sql.ref(`${alias}.id`)},
        'email', ${sql.ref(`${alias}.email`)},
        'username', ${sql.ref(`${alias}.username`)}
      )
    ELSE NULL END
  `.as(alias);
}

function todoDateProjection() {
  return sql<string>`todos.date`.as('date');
}

function todoCreatedAtProjection() {
  return sql<string | null>`todos.created_at`.as('created_at');
}

function todoUpdatedAtProjection() {
  return sql<string | null>`todos.updated_at`.as('updated_at');
}

function apiaryProjection() {
  return sql<{ name: string; modus: boolean } | null>`
    CASE WHEN apiaries.id IS NOT NULL THEN
      JSON_OBJECT('name', apiaries.name, 'modus', IF(apiaries.modus = 1, TRUE, FALSE))
    ELSE NULL END
  `.as('apiary');
}

interface TodoListInput extends TodoListQuery {
  ids?: number[];
}

function buildListQuery(db: Database, actor: TodoActor, input: TodoListInput) {
  const filters = parseFilters(input.filters);
  const search = input.q === undefined ? '' : String(input.q).trim();

  let query = db
    .selectFrom('todos')
    .leftJoin('bees as creator', 'creator.id', 'todos.bee_id')
    .leftJoin('bees as editor', 'editor.id', 'todos.edit_id')
    .leftJoin('apiaries', 'apiaries.id', 'todos.apiary_id')
    .where('todos.user_id', '=', actor.companyId)
    .where((eb) =>
      eb.or([
        eb('todos.apiary_id', 'is', null),
        eb('apiaries.deleted', '=', false),
      ]),
    )
    .$if(input.done !== undefined && input.done !== null, (qb) =>
      qb.where('todos.done', '=', input.done),
    )
    .$if(input.apiary_id !== undefined, (qb) =>
      qb.where('todos.apiary_id', '=', input.apiary_id),
    )
    .$if(input.ids !== undefined, (qb) =>
      qb.where('todos.id', 'in', input.ids ?? []),
    )
    .$if(search !== '', (qb) =>
      qb.where((eb) =>
        eb.or([
          eb('todos.name', 'like', `%${search}%`),
          eb('todos.note', 'like', `%${search}%`),
          eb('apiaries.name', 'like', `%${search}%`),
        ]),
      ),
    );

  for (const filter of filters) {
    if ('date' in filter) {
      query = query
        .where('todos.date', '>=', new Date(filter.date.from))
        .where('todos.date', '<=', new Date(filter.date.to));
    } else if ('id' in filter) {
      query = query.where('todos.id', '=', filter.id);
    } else if ('name' in filter) {
      query = query.where('todos.name', '=', filter.name);
    } else if ('note' in filter) {
      query = query.where('todos.note', '=', filter.note);
    } else if ('url' in filter) {
      query = query.where('todos.url', '=', filter.url);
    } else if ('done' in filter) {
      query = query.where('todos.done', '=', filter.done);
    } else if ('apiary_id' in filter) {
      query = query.where('todos.apiary_id', '=', filter.apiary_id);
    }
  }

  return query;
}

export async function listTodos(
  db: Database,
  actor: TodoActor,
  input: TodoListQuery,
) {
  const page = input.offset ?? 0;
  const pageSize =
    input.limit === 0 || input.limit === undefined ? 10 : input.limit;
  const skip = page * pageSize;
  const baseQuery = buildListQuery(db, actor, input);

  let resultQuery = baseQuery.select([
    'todos.id',
    'todos.name',
    todoDateProjection(),
    'todos.note',
    'todos.url',
    'todos.done',
    'todos.bee_id',
    'todos.edit_id',
    'todos.user_id',
    'todos.apiary_id',
    todoCreatedAtProjection(),
    todoUpdatedAtProjection(),
    actorProjection('creator'),
    actorProjection('editor'),
    apiaryProjection(),
  ]);

  if (input.order) {
    const fields = Array.isArray(input.order) ? input.order : [input.order];
    fields.forEach((field, index) => {
      const direction = Array.isArray(input.direction)
        ? input.direction[index]
        : input.direction;
      resultQuery = resultQuery.orderBy(
        orderColumns[field],
        direction ?? 'asc',
      );
    });
  }

  const [results, countResult] = await Promise.all([
    resultQuery
      .orderBy('todos.id', 'asc')
      .limit(pageSize)
      .offset(skip)
      .execute(),
    baseQuery
      .select(sql<number | string>`COUNT(*)`.as('count'))
      .executeTakeFirst(),
  ]);

  return { results, total: Number(countResult?.count ?? 0) };
}

export async function createTodos(
  db: Kysely<DB>,
  actor: TodoActor,
  body: TodoCreate,
): Promise<number[]> {
  if (body.apiary_id) {
    await checkOwnership(db, 'apiaries', body.apiary_id, actor.companyId);
  }

  return db.transaction().execute(async (trx) => {
    const ids: number[] = [];
    const base = {
      name: body.name,
      note: body.note ?? null,
      done: body.done ?? false,
      url: body.url ?? null,
      apiary_id: body.apiary_id ?? null,
      user_id: actor.companyId,
      bee_id: actor.beeId,
      ...(actor.isLlm && { ai_created_at: sql<Date>`UTC_TIMESTAMP()` }),
      ...insertTimestamps(),
    };

    const repeat = body.repeat ?? 0;
    const interval = body.interval ?? 0;
    let currentDate = body.date;
    for (let index = 0; index <= repeat; index++) {
      if (index > 0) {
        currentDate = dayjs(currentDate)
          .add(interval, 'days')
          .format('YYYY-MM-DD');
      }
      const result = await trx
        .insertInto('todos')
        .values({ ...base, date: new Date(currentDate) })
        .executeTakeFirstOrThrow();
      ids.push(Number(result.insertId));
    }
    return ids;
  });
}

export async function updateTodos(
  db: Database,
  actor: TodoActor,
  body: TodoBatchUpdate,
): Promise<number> {
  if (body.data.apiary_id) {
    await checkOwnership(db, 'apiaries', body.data.apiary_id, actor.companyId);
  }

  const result = await db
    .updateTable('todos')
    .set({
      ...(body.data.name !== undefined && { name: body.data.name }),
      ...(body.data.date !== undefined && { date: new Date(body.data.date) }),
      ...(body.data.note !== undefined && { note: body.data.note }),
      ...(body.data.url !== undefined && { url: body.data.url }),
      ...(body.data.done !== undefined && { done: body.data.done }),
      ...(body.data.apiary_id !== undefined && {
        apiary_id: body.data.apiary_id,
      }),
      edit_id: actor.beeId,
      ...(actor.isLlm && { ai_updated_at: sql<Date>`UTC_TIMESTAMP()` }),
      ...updateTimestamp(),
    })
    .where('user_id', '=', actor.companyId)
    .where('id', 'in', body.ids)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}

export async function getTodosByIds(
  db: Database,
  actor: TodoActor,
  body: TodoBatchGet,
) {
  return buildListQuery(db, actor, { ids: body.ids })
    .select([
      'todos.id',
      'todos.name',
      todoDateProjection(),
      'todos.note',
      'todos.url',
      'todos.done',
      'todos.bee_id',
      'todos.edit_id',
      'todos.user_id',
      'todos.apiary_id',
      todoCreatedAtProjection(),
      todoUpdatedAtProjection(),
      actorProjection('creator'),
      actorProjection('editor'),
      apiaryProjection(),
    ])
    .execute();
}

export async function deleteTodos(
  db: Database,
  actor: TodoActor,
  body: TodoBatchDelete,
): Promise<number> {
  const result = await db
    .deleteFrom('todos')
    .where('user_id', '=', actor.companyId)
    .where('id', 'in', body.ids)
    .executeTakeFirst();
  return Number(result.numDeletedRows);
}

export async function updateTodoStatus(
  db: Database,
  actor: TodoActor,
  body: TodoUpdateStatus,
): Promise<number> {
  const result = await db
    .updateTable('todos')
    .set({ done: body.status, edit_id: actor.beeId, ...updateTimestamp() })
    .where('user_id', '=', actor.companyId)
    .where('id', 'in', body.ids)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}

export async function updateTodoDate(
  db: Database,
  actor: TodoActor,
  body: TodoUpdateDate,
): Promise<number> {
  const result = await db
    .updateTable('todos')
    .set({
      date: new Date(body.start),
      edit_id: actor.beeId,
      ...updateTimestamp(),
    })
    .where('user_id', '=', actor.companyId)
    .where('id', 'in', body.ids)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}
