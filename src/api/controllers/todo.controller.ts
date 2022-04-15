import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Todo } from '@models/todo.model';
import dayjs from 'dayjs';

export class TodoController extends Controller {
  constructor() {
    super();
  }

  async get(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, offset, limit, q, filters } = req.query as any;
      const query = Todo.query()
        .withGraphJoined('creator')
        .withGraphJoined('editor')
        .where({
          user_id: req.user.user_id,
        })
        // Security as we may still have some unclean data in the database were linked apiary or hive does not exist anymore
        .page(offset, parseInt(limit) === 0 ? 10 : limit);

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
          console.log(e);
        }
      }

      if (Array.isArray(order)) {
        order.forEach((field, index) => query.orderBy(field, direction[index]));
      } else {
        query.orderBy(order, direction);
      }

      if (q.trim() !== '') {
        query.where((builder) => {
          builder
            .orWhere('todos.name', 'like', `%${q}%`)
            .orWhere('todos.note', 'like', `%${q}%`);
        });
      }
      const result = await query.orderBy('id');
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async post(req: IUserRequest, res: Response, next: NextFunction) {
    const insert = {
      date: req.body.date,
      name: req.body.name,
      note: req.body.note,
      done: req.body.done,
    };
    const repeat = req.body.repeat ? req.body.repeat : 0;
    const interval = req.body.interval ? req.body.interval : 0;

    try {
      const result = await Todo.transaction(async (trx) => {
        const result = [];

        const res = await Todo.query(trx).insert({
          ...insert,
          user_id: req.user.user_id,
          bee_id: req.user.bee_id,
        });
        result.push(res.id);
        if (repeat > 0) {
          for (let i = 0; i < repeat; i++) {
            insert.date = dayjs(insert.date)
              .add(interval, 'days')
              .format('YYYY-MM-DD');
            const res = await Todo.query(trx).insert({
              ...insert,
              user_id: req.user.user_id,
              bee_id: req.user.bee_id,
            });
            result.push(res.id);
          }
        }
        return result;
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async patch(req: IUserRequest, res: Response, next: NextFunction) {
    const ids = req.body.ids;
    const insert = { ...req.body.data };
    try {
      const result = await Todo.transaction(async (trx) => {
        return await Todo.query(trx)
          .patch({ ...insert, bee_id: req.user.bee_id })
          .findByIds(ids)
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async batchGet(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Todo.transaction(async (trx) => {
        const res = await Todo.query(trx)
          .findByIds(req.body.ids)
          .where('user_id', req.user.user_id);
        return res;
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async batchDelete(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Todo.transaction(async (trx) => {
        return Todo.query(trx)
          .delete()
          .whereIn('id', req.body.ids)
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async updateStatus(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Todo.transaction(async (trx) => {
        return Todo.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            done: req.body.status,
          })
          .findByIds(req.body.ids)
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async updateDate(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Todo.transaction(async (trx) => {
        return Todo.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            date: req.body.start,
          })
          .findByIds(req.body.ids)
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
