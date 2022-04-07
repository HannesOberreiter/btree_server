import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { Movedate } from '@models/Movedate.model';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Apiary } from '../models/apiary.model';
import { HiveLocation } from '../models/hive_location.model';

export class MovedateController extends Controller {
  constructor() {
    super();
  }

  async get(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, offset, limit, q, filters } = req.query as any;
      const query = Movedate.query()
        .withGraphJoined('hive')
        .withGraphJoined('apiary')
        .withGraphJoined('creator')
        .withGraphJoined('editor')
        .where({
          'apiary.user_id': req.user.user_id,
        })
        // Security as we may still have some unclean data in the database were linked apiary or hive does not exist anymore
        .whereNotNull('apiary.id')
        .whereNotNull('hive.id')
        .page(offset, parseInt(limit) === 0 ? 10 : limit);

      if (filters) {
        try {
          const filtering = JSON.parse(filters);
          if (Array.isArray(filtering)) {
            filtering.forEach((v) => {
              if ('date' in v && typeof v['date'] === 'object') {
                query.whereBetween('date', [v.date.from, v.date.to]);
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
            .orWhere('hive.name', 'like', `%${q}%`)
            .orWhere('apiary.name', 'like', `%${q}%`);
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
    try {
      const ids = req.body.ids;
      const insert = { ...req.body.data };
      const result = await Movedate.transaction(async (trx) => {
        return await Movedate.query(trx)
          .patch({
            ...insert,
            'movedates.edit_id': req.user.bee_id,
          })
          .findByIds(ids)
          .leftJoinRelated('apiary')
          .where('apiary.user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async post(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const hive_ids = req.body.hive_ids;
      const insert = {
        apiary_id: req.body.apiary_id,
        date: req.body.date,
      };
      const result = await Movedate.transaction(async (trx) => {
        await Apiary.query(trx)
          .findByIds(insert.apiary_id)
          .throwIfNotFound()
          .where('user_id', req.user.user_id);

        const result = [];
        for (let i = 0; i < hive_ids.length; i++) {
          const id = hive_ids[i];

          await HiveLocation.query()
            .where({
              user_id: req.user.user_id,
              hive_id: id,
            })
            .throwIfNotFound();

          const res = await Movedate.query(trx).insert({
            ...insert,
            hive_id: id,
            bee_id: req.user.bee_id,
          });
          result.push(res.id);
        }
        return result;
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
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
            date: req.body.start,
          })
          .findByIds(ids_array);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async batchGet(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Movedate.transaction(async (trx) => {
        const res = await Movedate.query(trx)
          .findByIds(req.body.ids)
          .withGraphJoined('hive')
          .withGraphJoined('apiary')
          .where('apiary.user_id', req.user.user_id);
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
      const result = await Movedate.transaction(async (trx) => {
        return await Movedate.query(trx)
          .delete()
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
