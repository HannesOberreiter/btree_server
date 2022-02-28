import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { Rearing } from '@models/rearing/rearing.model';
import { IUserRequest } from '@interfaces/IUserRequest.interface';

export class RearingController extends Controller {
  constructor() {
    super();
  }

  async updateDate(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Rearing.transaction(async (trx) => {
        return Rearing.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            date: req.body.start
          })
          .findByIds(req.body.ids)
          .where('rearings.user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async batchDelete(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Rearing.transaction(async (trx) => {
        return Rearing.query(trx)
          .deleteById(req.body.ids)
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
