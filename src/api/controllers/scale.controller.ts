import { Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Scale } from '../models/scale.model';
import { Hive } from '../models/hive.model';
import { ScaleData } from '../models/scale_data.model';

export class ScaleController extends Controller {
  constructor() {
    super();
  }
  async get(req: IUserRequest, res: Response, next) {
    try {
      const query = Scale.query()
        .select('settings')
        .where('user_id', req.user.user_id);

      if (req.params.id) {
        query.findById(req.params.id);
      }

      res.locals.data = await query;
      next();
    } catch (e) {
      next();
    }
  }
  async patch(req: IUserRequest, res: Response, next) {
    try {
      const result = await Scale.transaction(async (trx) => {
        if (req.body.hive_id)
          await Hive.query(trx)
            .where({ id: req.body.hive_id, user_id: req.user.user_id })
            .throwIfNotFound();

        return await Scale.query(trx)
          .patch({ name: req.body.name, hive_id: req.body.hive_id })
          .findById(req.params.id)
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
        await ScaleData.query(trx)
          .delete()
          .joinRelated('scale')
          .where({
            scale_id: req.body.params.id,
            'scale.user_id': req.user.user_id,
          });
        return await Scale.query(trx)
          .deleteById(req.body.params.id)
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
