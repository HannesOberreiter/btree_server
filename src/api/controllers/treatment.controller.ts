import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Treatment } from '@models/treatment.model';
import { map } from 'lodash';
import { Hive } from '../models/hive.model';
import dayjs from 'dayjs';
export class TreatmentController extends Controller {
  constructor() {
    super();
  }

  async get(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, offset, limit, q, filters, deleted } =
        req.query as any;
      const query = Treatment.query()
        .withGraphJoined(
          '[treatment_apiary, type, disease, hive, creator(identifier), editor(identifier)]'
        )
        .where('treatment_apiary.user_id', req.user.user_id)
        .where({
          'treatments.deleted': deleted === 'true',
        })
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
            .orWhere('disease.name', 'like', `%${q}%`)
            .orWhere('type.name', 'like', `%${q}%`);
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
      const result = await Treatment.transaction(async (trx) => {
        return await Treatment.query(trx)
          .patch({ ...insert, edit_id: req.user.bee_id })
          .findByIds(ids)
          .leftJoinRelated('treatment_apiary')
          .where('treatment_apiary.user_id', req.user.user_id);
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
      const interval = req.body.interval;
      const repeat = req.body.repeat;
      const insert = req.body;
      delete insert.hive_ids;
      delete insert.interval;
      delete insert.repeat;

      const result = await Treatment.transaction(async (trx) => {
        const hives = await Hive.query(trx)
          .distinct('hives.id')
          .findByIds(hive_ids)
          .leftJoinRelated('apiaries')
          .where('apiaries.user_id', req.user.user_id);

        const result = [];
        for (const hive in hives) {
          const res = await Treatment.query(trx).insert({
            ...insert,
            hive_id: hives[hive].id,
            bee_id: req.user.bee_id,
          });
          result.push(res.id);
          if (repeat > 0) {
            for (let i = 0; i < repeat; i++) {
              insert.date = dayjs(insert.date)
                .add(interval, 'days')
                .format('YYYY-MM-DD');
              insert.enddate = dayjs(insert.enddate)
                .add(interval, 'days')
                .format('YYYY-MM-DD');
              const res = await Treatment.query(trx).insert({
                ...insert,
                hive_id: hives[hive].id,
                bee_id: req.user.bee_id,
              });
              result.push(res.id);
            }
          }
        }
        return result;
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async updateStatus(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Treatment.transaction(async (trx) => {
        return Treatment.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            done: req.body.status,
          })
          .findByIds(req.body.ids)
          .leftJoinRelated('treatment_apiary')
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async updateDate(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Treatment.transaction(async (trx) => {
        return Treatment.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            date: req.body.start,
            enddate: req.body.end,
          })
          .findByIds(req.body.ids)
          .leftJoinRelated('treatment_apiary')
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
      const result = await Treatment.transaction(async (trx) => {
        const res = await Treatment.query(trx)
          .findByIds(req.body.ids)
          .withGraphJoined('[treatment_apiary, type, disease, vet, hive]')
          .where('treatment_apiary.user_id', req.user.user_id);
        return res;
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async batchDelete(req: IUserRequest, res: Response, next: NextFunction) {
    const hardDelete = req.query.hard ? true : false;
    const restoreDelete = req.query.restore ? true : false;

    try {
      const result = await Treatment.transaction(async (trx) => {
        const res = await Treatment.query(trx)
          .findByIds(req.body.ids)
          .select('id', 'deleted')
          .withGraphJoined('treatment_apiary')
          .where('user_id', req.user.user_id);

        const softIds = [];
        const hardIds = [];
        map(res, (obj) => {
          if ((obj.deleted || hardDelete) && !restoreDelete)
            hardIds.push(obj.id);
          else softIds.push(obj.id);
        });

        if (hardIds.length > 0)
          await Treatment.query(trx).delete().whereIn('id', hardIds);
        if (softIds.length > 0)
          await Treatment.query(trx)
            .patch({
              deleted: restoreDelete ? false : true,
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
