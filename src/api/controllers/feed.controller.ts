import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Feed } from '@models/feed.model';
import { map } from 'lodash';
import { Hive } from '../models/hive.model';
import dayjs from 'dayjs';
export class FeedController extends Controller {
  constructor() {
    super();
  }

  async get(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, offset, limit, q, filters, deleted, done } =
        req.query as any;
      const query = Feed.query()
        .withGraphJoined(
          '[feed_apiary, type, hive, creator(identifier), editor(identifier)]'
        )
        .where({
          'hive.deleted': false,
          'feeds.user_id': req.user.user_id,
          'feeds.deleted': deleted === 'true',
        })
        .page(
          offset ? offset : 0,
          parseInt(limit) === 0 || !limit ? 10 : limit
        );

      if (done) {
        query.where('feeds.done', done === 'true');
      }

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
              .orWhere('hive.name', 'like', `%${q}%`)
              .orWhere('type.name', 'like', `%${q}%`);
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
    try {
      const ids = req.body.ids;
      const insert = { ...req.body.data };
      const result = await Feed.transaction(async (trx) => {
        return await Feed.query(trx)
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

  async post(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const hive_ids = req.body.hive_ids;
      const interval = req.body.interval;
      const repeat = req.body.repeat;

      const insert = req.body;
      delete insert.hive_ids;
      delete insert.interval;
      delete insert.repeat;

      const result = await Feed.transaction(async (trx) => {
        const hives = await Hive.query(trx)
          .distinct('hives.id')
          .findByIds(hive_ids)
          .leftJoinRelated('apiaries')
          .where('apiaries.user_id', req.user.user_id);

        const result = [];
        for (const hive in hives) {
          const res = await Feed.query(trx).insert({
            ...insert,
            hive_id: hives[hive].id,
            bee_id: req.user.bee_id,
            user_id: req.user.user_id,
          });
          result.push(res.id);

          if (repeat > 0) {
            const insert_repeat = { ...insert };
            for (let i = 0; i < repeat; i++) {
              insert_repeat.date = dayjs(insert_repeat.date)
                .add(interval, 'days')
                .format('YYYY-MM-DD');
              insert_repeat.enddate = dayjs(insert_repeat.enddate)
                .add(interval, 'days')
                .format('YYYY-MM-DD');
              const res = await Feed.query(trx).insert({
                ...insert_repeat,
                hive_id: hives[hive].id,
                bee_id: req.user.bee_id,
                user_id: req.user.user_id,
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
      const result = await Feed.transaction(async (trx) => {
        return Feed.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            done: req.body.status,
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

  async updateDate(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Feed.transaction(async (trx) => {
        return Feed.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            date: req.body.start,
            enddate: req.body.end,
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

  async batchGet(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Feed.transaction(async (trx) => {
        const res = await Feed.query(trx)
          .findByIds(req.body.ids)
          .withGraphJoined('[type, hive]')
          .where('feeds.user_id', req.user.user_id);
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
      const result = await Feed.transaction(async (trx) => {
        const res = await Feed.query(trx)
          .findByIds(req.body.ids)
          .select('id', 'deleted')
          .where('user_id', req.user.user_id);

        const softIds = [];
        const hardIds = [];
        map(res, (obj) => {
          if ((obj.deleted || hardDelete) && !restoreDelete)
            hardIds.push(obj.id);
          else softIds.push(obj.id);
        });

        if (hardIds.length > 0)
          await Feed.query(trx).delete().whereIn('id', hardIds);
        if (softIds.length > 0)
          await Feed.query(trx)
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
