import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Apiary } from '../models/apiary.model';
import { conflict, forbidden } from '@hapi/boom';
import { map } from 'lodash';
import dayjs from 'dayjs';
export class ApiaryController extends Controller {
  constructor() {
    super();
  }

  async patch(req: IUserRequest, res: Response, next) {
    try {
      const ids = req.body.ids;
      const insert = { ...req.body.data };
      const result = await Apiary.transaction(async (trx) => {
        if (req.body.name) {
          if (ids.length > 1) throw conflict('name');
          const checkDuplicate = await Apiary.query()
            .where('user_id', req.user.user_id)
            .where('name', req.body.name);
          if (checkDuplicate.length > 1) throw conflict('name');
        }
        return await Apiary.query(trx)
          .patch({ ...insert, edit_id: req.user.bee_id })
          .findByIds(ids)
          .withGraphFetched('hive_count')
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async get(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, offset, limit, modus, deleted, q, details } =
        req.query as any;
      const query = Apiary.query()
        .where({
          'apiaries.user_id': req.user.user_id,
          'apiaries.deleted': deleted === 'true',
        })
        .page(offset, parseInt(limit) === 0 ? 10 : limit);

      if (modus) {
        query.where('apiaries.modus', modus === 'true');
      }

      if (details === 'true') {
        query.withGraphJoined(
          '[hive_count, creator(identifier),editor(identifier)]'
        );
      } else {
        query.withGraphJoined('[hive_count]');
      }

      if (Array.isArray(order)) {
        order.forEach((field, index) => query.orderBy(field, direction[index]));
      } else {
        query.orderBy(order, direction);
      }

      if (q.trim() !== '') {
        query.where((builder) => {
          builder.orWhere('name', 'like', `%${q}%`);
        });
      }
      const result = await query.orderBy('id');
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async post(req: IUserRequest, res: Response, next) {
    try {
      const result = await Apiary.transaction(async (trx) => {
        const checkDuplicate = await Apiary.query().where({
          user_id: req.user.user_id,
          name: req.body.name,
        });

        if (checkDuplicate.length > 0) throw conflict('name');
        return Apiary.query(trx).insertAndFetch({
          bee_id: req.user.bee_id,
          user_id: req.user.user_id,
          ...req.body,
        });
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async updateStatus(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Apiary.transaction(async (trx) => {
        return Apiary.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            modus: req.body.status,
          })
          .findByIds(req.body.ids)
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
      const hardDelete = req.query.hard ? true : false;
      const restoreDelete = req.query.restore ? true : false;

      const result = await Apiary.transaction(async (trx) => {
        const res = await Apiary.query()
          .withGraphFetched('hive_count')
          .where('user_id', req.user.user_id)
          .whereIn('id', req.body.ids);

        const softIds = [];
        const hardIds = [];
        map(res, (obj) => {
          if (obj.hive_count) throw forbidden();

          if ((obj.deleted || hardDelete) && !restoreDelete)
            hardIds.push(obj.id);
          else softIds.push(obj.id);
        });

        if (hardIds.length > 0) {
          await Apiary.query(trx).delete().whereIn('id', hardIds);
        }

        if (softIds.length > 0)
          await Apiary.query(trx)
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

  async batchGet(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Apiary.query().findByIds(req.body.ids).where({
        user_id: req.user.user_id,
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
