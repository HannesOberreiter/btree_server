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
    next();
  }

  async post(req: IUserRequest, res: Response, next: NextFunction) {
    const insert = {
      date: req.body.date,
      name: req.body.name,
      note: req.body.note
    };
    const repeat = req.body.repeat ? req.body.repeat : 0;
    const interval = req.body.interval ? req.body.interval : 0;

    try {
      const result = await Todo.transaction(async (trx) => {
        const result = [];

        const res = await Todo.query(trx).insert({
          ...insert,
          done: false,
          user_id: req.user.user_id,
          bee_id: req.user.bee_id
        });
        result.push(res.id);
        if (repeat > 0) {
          for (let i = 0; i < repeat; i++) {
            insert.date = dayjs(insert.date)
              .add(interval, 'days')
              .format('YYYY-MM-DD');
            const res = await Todo.query(trx).insert({
              ...insert,
              done: false,
              user_id: req.user.user_id,
              bee_id: req.user.bee_id
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

  async batchDelete(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Todo.transaction(async (trx) => {
        return Todo.query(trx)
          .deleteById(req.body.ids)
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
            done: req.body.status
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
            date: req.body.start
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
