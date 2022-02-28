import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Todo } from '@models/todo.model';

export class TodoController extends Controller {
  constructor() {
    super();
  }

  async get(req: IUserRequest, res: Response, next: NextFunction) {
    next();
  }

  async post(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Todo.transaction(async (trx) => {
        return Todo.query(trx).insert({
          ...req.body,
          done: false,
          user_id: req.user.user_id,
          bee_id: req.user.bee_id
        });
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
