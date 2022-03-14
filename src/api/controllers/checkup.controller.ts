import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { Checkup } from '@models/checkup.model';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { map } from 'lodash';
import { randomInt } from 'crypto';
import { Apiary } from '../models/apiary.model';
import { getTemperature } from '../utils/temperature.util';
export class CheckupController extends Controller {
  constructor() {
    super();
  }

  async updateStatus(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Checkup.transaction(async (trx) => {
        return Checkup.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            done: req.body.status
          })
          .findByIds(req.body.ids)
          .leftJoinRelated('checkup_apiary')
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
      const result = await Checkup.transaction(async (trx) => {
        return Checkup.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            date: req.body.start,
            enddate: req.body.end
          })
          .findByIds(req.body.ids)
          .leftJoinRelated('checkup_apiary')
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async batchDelete(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Checkup.transaction(async (trx) => {
        const res = await Checkup.query(trx)
          .findByIds(req.body.ids)
          .select('id', 'deleted')
          .withGraphJoined('checkup_apiary')
          .where('user_id', req.user.user_id);

        const softIds = [];
        const hardIds = [];
        map(res, (obj) => {
          if (obj.deleted) hardIds.push(obj.id);
          else softIds.push(obj.id);
        });

        if (hardIds.length > 0) await Checkup.query(trx).deleteById(hardIds);
        if (softIds.length > 0)
          await Checkup.query(trx)
            .patch({
              deleted: true,
              edit_id: req.user.bee_id
            })
            .findByIds(softIds);

        return res;
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
