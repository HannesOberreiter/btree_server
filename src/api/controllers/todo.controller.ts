import { checkMySQLError } from '@utils/error.util';
import { Todo } from '@models/todo.model';
import dayjs from 'dayjs';
import { FastifyRequest, FastifyReply } from 'fastify';

export default class TodoController {
  static async get(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { order, direction, offset, limit, q, filters, done } =
        req.query as any;
      const query = Todo.query()
        .withGraphJoined('[creator(identifier), editor(identifier)]')
        .where({
          user_id: req.session.user.user_id,
        })
        .page(
          offset ? offset : 0,
          parseInt(limit) === 0 || !limit ? 10 : limit,
        );

      if (done) {
        query.where('todos.done', done === 'true');
      }

      if (filters) {
        try {
          const filtering = JSON.parse(filters);
          if (Array.isArray(filtering)) {
            filtering.forEach((v) => {
              if ('date' in v && typeof v['date'] === 'object') {
                query.whereBetween('date', [v.date.from, v.date.to]);
              } else {
                query.where(v);
              }
            });
          }
        } catch (e) {
          req.log.error(e);
        }
      }
      if (order) {
        if (Array.isArray(order)) {
          order.forEach((field, index) =>
            query.orderBy(field, direction[index]),
          );
        } else {
          query.orderBy(order, direction);
        }
      }
      if (q) {
        if (q.trim() !== '') {
          query.where((builder) => {
            builder
              .orWhere('todos.name', 'like', `%${q}%`)
              .orWhere('todos.note', 'like', `%${q}%`);
          });
        }
      }
      const result = await query.orderBy('id');
      return { ...result };
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async post(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const insert = {
        date: body.date,
        name: body.name,
        note: body.note,
        done: body.done,
        url: body.url,
      };
      const repeat = body.repeat ? body.repeat : 0;
      const interval = body.interval ? body.interval : 0;
      const result = await Todo.transaction(async (trx) => {
        const result = [];

        const res = await Todo.query(trx).insert({
          ...insert,
          user_id: req.session.user.user_id,
          bee_id: req.session.user.bee_id,
        });
        result.push(res.id);
        if (repeat > 0) {
          for (let i = 0; i < repeat; i++) {
            insert.date = dayjs(insert.date)
              .add(interval, 'days')
              .format('YYYY-MM-DD');
            const res = await Todo.query(trx).insert({
              ...insert,
              user_id: req.session.user.user_id,
              bee_id: req.session.user.bee_id,
            });
            result.push(res.id);
          }
        }
        return result;
      });
      return { ...result };
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async patch(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const ids = body.ids;
    const insert = { ...body.data };
    try {
      const result = await Todo.transaction(async (trx) => {
        return await Todo.query(trx)
          .patch({ ...insert, bee_id: req.session.user.bee_id })
          .findByIds(ids)
          .where('user_id', req.session.user.user_id);
      });
      return result;
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async batchGet(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const result = await Todo.transaction(async (trx) => {
        const res = await Todo.query(trx)
          .findByIds(body.ids)
          .where('user_id', req.session.user.user_id);
        return res;
      });
      return { ...result };
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async batchDelete(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const result = await Todo.transaction(async (trx) => {
        return Todo.query(trx)
          .delete()
          .whereIn('id', body.ids)
          .where('user_id', req.session.user.user_id);
      });
      return result;
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async updateStatus(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const result = await Todo.transaction(async (trx) => {
        return Todo.query(trx)
          .patch({
            edit_id: req.session.user.bee_id,
            done: body.status,
          })
          .findByIds(body.ids)
          .where('user_id', req.session.user.user_id);
      });
      return result;
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async updateDate(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const result = await Todo.transaction(async (trx) => {
        return Todo.query(trx)
          .patch({
            edit_id: req.session.user.bee_id,
            date: body.start,
          })
          .findByIds(body.ids)
          .where('user_id', req.session.user.user_id);
      });
      return result;
    } catch (e) {
      throw checkMySQLError(e);
    }
  }
}
