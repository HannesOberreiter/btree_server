import { Controller } from '@classes/controller.class';
import { Charge } from '../models/charge.model';
import { NextFunction, Response } from 'express';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import dayjs from 'dayjs';
import { map } from 'lodash';

export class ChargeController extends Controller {
  constructor() {
    super();
  }

  async get(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, offset, limit, q, filters, deleted } =
        req.query as any;
      const query = Charge.query()
        .withGraphJoined('type')
        .withGraphJoined('creator')
        .withGraphJoined('editor')
        .where({
          'charges.user_id': req.user.user_id,
          'charges.deleted': deleted === 'true',
        })
        // Security as we may still have some unclean data in the database were linked apiary or hive does not exist anymore
        .page(offset, parseInt(limit) === 0 ? 10 : limit);

      if (filters) {
        try {
          const filtering = JSON.parse(filters);
          if (Array.isArray(filtering)) {
            filtering.forEach((v) => {
              if ('bestbefore' in v && typeof v['bestbefore'] === 'object') {
                query.whereBetween('bestbefore', [
                  v.bestbefore.from,
                  v.bestbefore.to,
                ]);
              } else {
                query.where(v);
              }
            });
          }
        } catch (e) {
          console.log(e);
        }
      }

      if (Array.isArray(order)) {
        order.forEach((field, index) => query.orderBy(field, direction[index]));
      } else {
        query.orderBy(order, direction);
      }

      if (q.trim() !== '') {
        query.where((builder) => {
          builder
            .orWhere('type.name', 'like', `%${q}%`)
            .orWhere('charges.name', 'like', `%${q}%`);
        });
      }
      const result = await query.orderBy('id');
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async post(req: IUserRequest, res: Response, next: NextFunction) {
    const insert = {
      date: req.body.date,
      bestbefore: req.body.bestbefore,
      name: req.body.name,
      charge: req.body.charge,
      price: req.body.price,
      amount: req.body.amount,
      unit: req.body.unit,
      url: req.body.url,
      kind: req.body.kind,
      type_id: req.body.type_id,
      note: req.body.note,
    };

    try {
      const result = await Charge.transaction(async (trx) => {
        const result = [];

        const res = await Charge.query(trx).insert({
          ...insert,
          user_id: req.user.user_id,
          bee_id: req.user.bee_id,
        });
        result.push(res.id);
        return result;
      });
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
      const result = await Charge.transaction(async (trx) => {
        return await Charge.query(trx)
          .patch({ ...insert, bee_id: req.user.bee_id })
          .findByIds(ids)
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async batchGet(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Charge.transaction(async (trx) => {
        const res = await Charge.query(trx)
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
      const hardDelete = req.query.hard ? true : false;
      const restoreDelete = req.query.restore ? true : false;

      const result = await Charge.transaction(async (trx) => {
        const res = await Charge.query()
          .where('user_id', req.user.user_id)
          .whereIn('id', req.body.ids);

        const softIds = [];
        const hardIds = [];
        map(res, (obj) => {
          if ((obj.deleted || hardDelete) && !restoreDelete)
            hardIds.push(obj.id);
          else softIds.push(obj.id);
        });

        if (hardIds.length > 0) {
          await Charge.query(trx).delete().whereIn('id', hardIds);
        }

        if (softIds.length > 0)
          await Charge.query(trx)
            .patch({
              deleted: restoreDelete ? false : true,
              deleted_at: dayjs()
                .utc()
                .toISOString()
                .slice(0, 19)
                .replace('T', ' '),
              edit_id: req.user.bee_id,
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
