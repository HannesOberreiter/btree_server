import { Controller } from '@classes/controller.class';
import { Charge } from '../models/charge.model';
import { NextFunction, Response } from 'express';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import dayjs from 'dayjs';
import { map } from 'lodash';
import { ChargeStock } from '../models/charge_stock.model';

export default class ChargeController extends Controller {
  constructor() {
    super();
  }

  async get(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, offset, limit, q, filters, deleted } =
        req.query as any;
      const query = Charge.query()
        .withGraphJoined(
          '[type.stock, creator(identifier), editor(identifier)]'
        )
        .where({
          'charges.user_id': req.user.user_id,
          'charges.deleted': deleted === 'true',
        })
        // Security as we may still have some unclean data in the database were linked apiary or hive does not exist anymore
        .page(
          offset ? offset : 0,
          parseInt(limit) === 0 || !limit ? 10 : limit
        );

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
          console.error(e);
        }
      }
      if (order) {
        if (Array.isArray(order)) {
          order.forEach((field, index) =>
            query.orderBy(field, direction[index])
          );
        } else {
          query.orderBy(order, direction);
        }
      }
      if (q) {
        if (q.trim() !== '') {
          query.where((builder) => {
            builder
              .orWhere('type.name', 'like', `%${q}%`)
              .orWhere('charges.name', 'like', `%${q}%`)
              .orWhere('charges.charge', 'like', `%${q}%`);
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

  async getStock(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, offset, limit, q } = req.query as any;
      const query = ChargeStock.query()
        .select('type.id', 'sum', 'type.name', 'type.unit', 'sum_in', 'sum_out')
        .leftJoinRelated('type')
        .where({
          'charge_stocks.user_id': req.user.user_id,
          'type.modus': true,
        })
        // Security as we may still have some unclean data in the database were linked apiary or hive does not exist anymore
        .page(
          offset ? offset : 0,
          parseInt(limit) === 0 || !limit ? 10 : limit
        );

      if (order) {
        if (Array.isArray(order)) {
          order.forEach((field, index) =>
            query.orderBy(field, direction[index])
          );
        } else {
          query.orderBy(order, direction);
        }
      }
      if (q) {
        if (q.trim() !== '') {
          query.where((builder) => {
            builder.orWhere('type.name', 'like', `%${q}%`);
          });
        }
      }
      const result = await query.orderBy('type_id');
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async post(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const insert = {
        date: req.body.date,
        bestbefore: req.body.bestbefore,
        name: req.body.name,
        charge: req.body.charge,
        price: req.body.price,
        amount: req.body.amount,
        url: req.body.url,
        kind: req.body.kind,
        type_id: req.body.type_id,
        note: req.body.note,
      };
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
          .patch({ ...insert, edit_id: req.user.bee_id })
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
