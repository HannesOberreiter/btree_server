import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { RearingType } from '../models/rearing/rearing_type.model';
import { RearingStep } from '../models/rearing/rearing_step.model';
import { Rearing } from '../models/rearing/rearing.model';

export default class RearingTypeController extends Controller {
  constructor() {
    super();
  }

  async get(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, offset, limit, q } = req.query as any;
      const query = RearingType.query()
        .withGraphFetched('step(orderByPosition).detail')
        .where({
          'rearing_types.user_id': req.user.user_id,
        })
        .page(
          offset ? offset : 0,
          parseInt(limit) === 0 || !limit ? 10 : limit,
        );

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
            builder.orWhere('rearing_types.name', 'like', `%${q}%`);
          });
        }
      }
      const result = await query.orderBy('id');
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
      const result = await RearingType.transaction(async (trx) => {
        return await RearingType.query(trx)
          .patch({ ...insert })
          .findByIds(ids)
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async post(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await RearingType.transaction(async (trx) => {
        return await RearingType.query(trx).insert({
          ...req.body,
          user_id: req.user.user_id,
        });
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async batchGet(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await RearingType.transaction(async (trx) => {
        const res = await RearingType.query(trx)
          .withGraphFetched('detail')
          .findByIds(req.body.ids)
          .where('rearing_types.user_id', req.user.user_id);
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
      const result = await RearingType.transaction(async (trx) => {
        await RearingStep.query(trx)
          .withGraphJoined('type')
          .delete()
          .where('type.user_id', req.user.user_id)
          .whereIn('type_id', req.body.ids);

        await Rearing.query(trx)
          .delete()
          .where('rearings.user_id', req.user.user_id)
          .whereIn('type_id', req.body.ids);

        return await RearingType.query(trx)
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
}
