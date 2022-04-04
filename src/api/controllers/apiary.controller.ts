import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Apiary } from '../models/apiary.model';
import { conflict, forbidden } from '@hapi/boom';
export class ApiaryController extends Controller {
  constructor() {
    super();
  }

  async get(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, offset, limit, modus, deleted, q, details } =
        req.query as any;
      const query = Apiary.query()
        .withGraphFetched('hive_count')
        .where({
          'apiaries.user_id': req.user.user_id,
          'apiaries.deleted': deleted === 'true'
        })
        .page(offset, parseInt(limit) === 0 ? 10 : limit);

      if (modus !== 'null') {
        query.where('apiaries.modus', modus === 'true');
      }

      if (details === 'true') {
        query.withGraphJoined('creator').withGraphJoined('editor');
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

  async getApiary(req: IUserRequest, res: Response, next) {
    try {
      const result = await Apiary.query()
        .findById(req.params.id)
        .withGraphFetched('hive_count')
        .where('deleted', 0)
        .where('user_id', req.user.user_id);
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async createApiary(req: IUserRequest, res: Response, next) {
    try {
      const result = await Apiary.transaction(async (trx) => {
        const checkDuplicate = await Apiary.query().where({
          user_id: req.user.user_id,
          name: req.body.name
        });

        if (checkDuplicate.length > 0) throw conflict('name');
        return Apiary.query(trx).insertAndFetch({
          bee_id: req.user.bee_id,
          user_id: req.user.user_id,
          ...req.body
        });
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
  async updateApiary(req: IUserRequest, res: Response, next) {
    try {
      const result = await Apiary.transaction(async (trx) => {
        if (req.body.name) {
          const checkDuplicate = await Apiary.query()
            .where('user_id', req.user.user_id)
            .where('name', req.body.name)
            .whereNot('id', req.body.id);
          if (checkDuplicate.length > 0) throw conflict('name');
        }
        return Apiary.query(trx)
          .patchAndFetchById(req.body.id, {
            edit_id: req.user.bee_id,
            ...req.body
          })
          .withGraphFetched('hive_count')
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async deleteApiary(req: IUserRequest, res: Response, next) {
    try {
      const result = await Apiary.transaction(async (trx) => {
        const res = await Apiary.query(trx)
          .findById(req.params.id)
          .withGraphFetched('hive_count')
          .where('user_id', req.user.user_id);
        if (res.hive_count) throw forbidden();
        if (res.deleted) {
          return await Apiary.query(trx).deleteById(res.id);
        } else {
          return await Apiary.query(trx)
            .patch({
              deleted: true,
              edit_id: req.user.bee_id
            })
            .findById(res.id);
        }
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
