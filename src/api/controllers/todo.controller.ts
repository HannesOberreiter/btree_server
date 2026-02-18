import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  TodoBatchDelete,
  TodoBatchGet,
  TodoBatchUpdate,
  TodoCreate,
  TodoUpdateDate,
  TodoUpdateStatus,
} from '../schemas/todo.schema.js';
import dayjs from 'dayjs';
import { sql } from 'kysely';
import { KyselyServer } from '../../servers/kysely.server.js';
import { transaction, withApiary, withCreatorAndEditor } from '../utils/kysely.utils.js';

interface GetQuery {
  order?: string | string[]
  direction?: 'asc' | 'desc' | ('asc' | 'desc')[]
  offset?: number | string
  limit?: number | string
  q?: string
  filters?: string
  done?: boolean
  apiary_id?: number | string
}

export default class TodoController {
  static async get(req: FastifyRequest<{ Querystring: GetQuery }>, _reply: FastifyReply) {
    const { order, direction, offset, limit, q, filters, done, apiary_id }
      = req.query;

    const db = KyselyServer.getInstance().db;
    const page = Number(offset) || 0;
    const pageSize = limit === 0 || !limit ? 10 : Number(limit);
    const skip = page * pageSize;

    let parsedFilters: any[] = [];
    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          parsedFilters = filtering;
        }
      }
      catch (e) {
        req.log.error(e);
      }
    }

    const search = q ? `${q}`.trim() : '';

    const query = db
      .selectFrom('todos')
      .select([
        'todos.id',
        'todos.name',
        'todos.date',
        'todos.note',
        'todos.url',
        'todos.done',
        'todos.bee_id',
        'todos.edit_id',
        'todos.user_id',
        'todos.apiary_id',
        'todos.created_at',
        'todos.updated_at',
      ])
      .$call(qb => withCreatorAndEditor(qb, { creatorColumn: 'todos.bee_id', editorColumn: 'todos.edit_id' }))
      .$call(qb => withApiary(qb as any, { apiaryColumn: 'todos.apiary_id' }))
      .where('todos.user_id', '=', req.session.user.user_id)
      .$if(done === true || done === false, qb => qb.where('todos.done', '=', done))
      .$if(!!apiary_id, qb => qb.where('todos.apiary_id', '=', Number(apiary_id)))
      .$if(parsedFilters.length > 0, (qb) => {
        let filterQuery = qb;
        for (const filter of parsedFilters) {
          if ('date' in filter && typeof filter.date === 'object') {
            filterQuery = filterQuery
              .where('todos.date', '>=', filter.date.from)
              .where('todos.date', '<=', filter.date.to);
          }
          else {
            for (const [key, value] of Object.entries(filter)) {
              filterQuery = filterQuery.where(key as any, '=', value as any);
            }
          }
        }
        return filterQuery;
      })
      .$if(!!order, (qb) => {
        if (Array.isArray(order)) {
          let orderQuery = qb;
          order.forEach((field, index) => {
            const dir = Array.isArray(direction) ? direction[index] : direction;
            orderQuery = orderQuery.orderBy(field as any, (dir || 'asc') as any);
          });
          return orderQuery;
        }
        else {
          return qb.orderBy(order as any, ((direction as string) || 'asc') as any);
        }
      })
      .$if(
        search !== '',
        qb => qb.where(eb =>
          eb.or([
            eb('todos.name', 'like', `%${search}%`),
            eb('todos.note', 'like', `%${search}%`),
          ]),
        ),
      );

    const countQuery = query
      .clearSelect()
      .select(sql`COUNT(*)`.as('count'));

    const [results, countResult] = await Promise.all([
      query
        .orderBy('todos.id', 'asc')
        .limit(pageSize)
        .offset(skip)
        .execute(),
      countQuery.executeTakeFirst(),
    ]);

    return {
      results,
      total: Number((countResult as any)?.count || 0),
    };
  }

  static async post(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as TodoCreate;
    const db = KyselyServer.getInstance().db;

    const insert = {
      date: new Date(body.date),
      name: body.name,
      note: body.note || null,
      done: body.done || false,
      url: body.url || null,
      apiary_id: body.apiary_id || null,
      user_id: req.session.user.user_id,
      bee_id: req.session.user.bee_id,
    };

    const repeat = body.repeat || 0;
    const interval = body.interval || 0;

    const result = await transaction(db, async (trx) => {
      const insertedIds: number[] = [];

      const res = await trx
        .insertInto('todos')
        .values(insert)
        .executeTakeFirst();

      insertedIds.push(Number(res.insertId));

      if (repeat > 0) {
        let currentDate = body.date;
        for (let i = 0; i < repeat; i++) {
          currentDate = dayjs(currentDate)
            .add(interval, 'days')
            .format('YYYY-MM-DD');

          const res = await trx
            .insertInto('todos')
            .values({
              ...insert,
              date: new Date(currentDate),
            })
            .executeTakeFirst();

          insertedIds.push(Number(res.insertId));
        }
      }
      return insertedIds;
    });

    return result;
  }

  static async patch(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as TodoBatchUpdate;
    const db = KyselyServer.getInstance().db;

    const updateData = {
      ...body.data as any,
      edit_id: req.session.user.bee_id,
    };

    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    const result = await transaction(db, async (trx) => {
      const res = await trx
        .updateTable('todos')
        .set(updateData)
        .where('user_id', '=', req.session.user.user_id)
        .where('id', 'in', body.ids)
        .executeTakeFirst();

      return Number(res.numUpdatedRows);
    });

    return result;
  }

  static async batchGet(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as TodoBatchGet;

    const db = KyselyServer.getInstance().db;

    const result = db.selectFrom('todos')
      .select([
        'todos.id',
        'todos.name',
        'todos.date',
        'todos.note',
        'todos.url',
        'todos.done',
        'todos.bee_id',
        'todos.edit_id',
        'todos.user_id',
        'todos.apiary_id',
        'todos.created_at',
        'todos.updated_at',
      ])
      .$call(qb => withCreatorAndEditor(qb, { creatorColumn: 'todos.bee_id', editorColumn: 'todos.edit_id' }))
      .$call(qb => withApiary(qb as any, { apiaryColumn: 'todos.apiary_id' }))
      .where('todos.user_id', '=', req.session.user.user_id)
      .where('todos.id', 'in', body.ids)
      .execute();

    return result;
  }

  static async batchDelete(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as TodoBatchDelete;
    const db = KyselyServer.getInstance().db;

    const result = await transaction(db, async (trx) => {
      const res = await trx
        .deleteFrom('todos')
        .where('user_id', '=', req.session.user.user_id)
        .where('id', 'in', body.ids)
        .executeTakeFirst();

      return Number(res.numDeletedRows);
    });

    return result;
  }

  static async updateStatus(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as TodoUpdateStatus;
    const db = KyselyServer.getInstance().db;

    const result = await transaction(db, async (trx) => {
      const res = await trx
        .updateTable('todos')
        .set({
          edit_id: req.session.user.bee_id,
          done: body.status,
        })
        .where('user_id', '=', req.session.user.user_id)
        .where('id', 'in', body.ids)
        .executeTakeFirst();

      return Number(res.numUpdatedRows);
    });

    return result;
  }

  static async updateDate(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as TodoUpdateDate;
    const db = KyselyServer.getInstance().db;

    const ids = body.ids.map(id => Number(id)).filter(id => !Number.isNaN(id));

    const result = await transaction(db, async (trx) => {
      const res = await trx
        .updateTable('todos')
        .set({
          edit_id: req.session.user.bee_id,
          date: new Date(body.start),
        })
        .where('user_id', '=', req.session.user.user_id)
        .where('id', 'in', ids)
        .executeTakeFirst();

      return Number(res.numUpdatedRows);
    });

    return result;
  }
}
