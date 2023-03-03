import { Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Scale } from '../models/scale.model';
import { Hive } from '../models/hive.model';
import { ScaleData } from '../models/scale_data.model';
import { limitScale } from '../utils/premium.util';
import { paymentRequired } from '@hapi/boom';

export default class ScaleController extends Controller {
  constructor() {
    super();
  }
  async get(req: IUserRequest, res: Response, next) {
    try {
      const query = Scale.query()
        .withGraphFetched('hive')
        .where('user_id', req.user.user_id);
      if (req.params.id) {
        query.findById(req.params.id);
      }
      res.locals.data = req.params.id ? [await query] : await query; // array is returned to be consistent with batchGet function
      next();
    } catch (e) {
      next();
    }
  }
  async patch(req: IUserRequest, res: Response, next) {
    try {
      const ids = req.body.ids;
      const insert = { ...req.body.data };

      const result = await Scale.transaction(async (trx) => {
        if (insert.hive_id)
          await Hive.query(trx)
            .where({ id: insert.hive_id, user_id: req.user.user_id })
            .throwIfNotFound();

        return await Scale.query(trx)
          .patch(insert)
          .findByIds(ids)
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
  async post(req: IUserRequest, res: Response, next) {
    try {
      const limit = await limitScale(req.user.user_id);
      if (limit) throw paymentRequired('no premium access');

      const result = await Scale.transaction(async (trx) => {
        if (req.body.hive_id)
          await Hive.query(trx)
            .where({ id: req.body.hive_id, user_id: req.user.user_id })
            .throwIfNotFound();

        return await Scale.query(trx).insert({
          name: req.body.name,
          hive_id: req.body.hive_id,
          user_id: req.user.user_id,
        });
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
  async delete(req: IUserRequest, res: Response, next) {
    try {
      const result = await Scale.transaction(async (trx) => {
        await ScaleData.query(trx).delete().joinRelated('scale').where({
          scale_id: req.params.id,
          'scale.user_id': req.user.user_id,
        });
        return await Scale.query(trx)
          .deleteById(req.params.id)
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
