import { Request, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Apiary } from '../models/apiary.model';
import { forbidden } from '@hapi/boom';
export class ApiaryController extends Controller {
  constructor() {
    super();
  }

  async getApiaries(req: IUserRequest, res: Response, next) {
    try {
      const result = await Apiary.query()
        .withGraphFetched('hive_count')
        .where('deleted', 0)
        .where('user_id', req.user.user_id);
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async createApiary(req: IUserRequest, res: Response, next) {
    try {
      const result = await Apiary.transaction(async (trx) => {
        return Apiary.query(trx).insertAndFetch({
          bee_id: req.user.bee_id,
          user_id: req.user.user_id,
          ...req.body
        });
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
  async updateApiary(req: IUserRequest, res: Response, next) {
    try {
      const result = await Apiary.transaction(async (trx) => {
        return Apiary.query(trx)
          .patchAndFetchById(req.body.id, {
            edit_id: req.user.bee_id,
            ...req.body
          })
          .withGraphFetched('hive_count')
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async deleteApiary(req: IUserRequest, res: Response, next) {
    try {
      const result = await Apiary.transaction(async (trx) => {
        const res = await Apiary.query(trx)
          .findById(req.params.id)
          .withGraphFetched('hive_count')
          .where('user_id', req.user.user_id);
        if (res.hive_count) throw forbidden();
        if (res.deleted) {
          return await Apiary.query(trx).deleteById(res.id);
        } else {
          return await Apiary.query(trx)
            .patch({
              deleted: true,
              edit_id: req.user.bee_id
            })
            .findById(res.id);
        }
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
