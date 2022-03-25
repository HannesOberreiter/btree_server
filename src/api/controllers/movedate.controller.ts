import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { Movedate } from '@models/Movedate.model';
import { IUserRequest } from '@interfaces/IUserRequest.interface';

export class MovedateController extends Controller {
  constructor() {
    super();
  }

  async updateDate(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Movedate.transaction(async (trx) => {
        // First checking if the movedate ids all belong to the user
        // we dont use a left join because of some hassle with ambigious fields
        const ids = await Movedate.query(trx)
          .select('movedates.id')
          .findByIds(req.body.ids)
          .leftJoinRelated('apiary')
          .where('user_id', req.user.user_id);
        const ids_array = ids.map((elem) => elem.id);
        return Movedate.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            date: req.body.start
          })
          .findByIds(ids_array);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async batchDelete(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Movedate.transaction(async (trx) => {
        return await Movedate.query(trx)
          .withGraphJoined('apiary')
          .withGraphJoined('movedate_count')
          .whereIn('movedates.id', req.body.ids)
          .where('user_id', req.user.user_id)
          .where('count', '>', 1);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
