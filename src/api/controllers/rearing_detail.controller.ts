import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { RearingDetail } from '../models/rearing/rearing_detail.model';
import { RearingStep } from '../models/rearing/rearing_step.model';

export class RearingDetailController extends Controller {
  constructor() {
    super();
  }

  async get(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, offset, limit, q } = req.query as any;
      const query = RearingDetail.query()
        .where({
          user_id: req.user.user_id,
        })
        .page(offset, parseInt(limit) === 0 ? 10 : limit);

      if (Array.isArray(order)) {
        order.forEach((field, index) => query.orderBy(field, direction[index]));
      } else {
        query.orderBy(order, direction);
      }

      if (q.trim() !== '') {
        query.where((builder) => {
          builder.orWhere('job', 'like', `%${q}%`);
        });
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
      const result = await RearingDetail.transaction(async (trx) => {
        return await RearingDetail.query(trx)
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
      const result = await RearingDetail.transaction(async (trx) => {
        return await RearingDetail.query(trx).insert({
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
      const result = await RearingDetail.transaction(async (trx) => {
        const res = await RearingDetail.query(trx)
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
      const result = await RearingDetail.transaction(async (trx) => {
        await RearingStep.query(trx)
          .withGraphJoined('detail')
          .delete()
          .where('detail.user_id', req.user.user_id)
          .whereIn('detail_id', req.body.ids);
        return await RearingDetail.query(trx)
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
