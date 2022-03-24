import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Harvest } from '@models/harvest.model';
import { map } from 'lodash';
import { Hive } from '../models/hive.model';
import dayjs from 'dayjs';
export class HarvestController extends Controller {
  constructor() {
    super();
  }

  async patch(req: IUserRequest, res: Response, next: NextFunction) {
    const ids = req.body.ids;
    const ignore = req.body.ignore;
    const insert = {};

    if (!ignore.date) insert['date'] = req.body.date;
    if (!ignore.date) insert['enddate'] = req.body.enddate;
    if (!ignore.type) insert['type_id'] = req.body.type;
    if (!ignore.amount) insert['amount'] = req.body.amount_calc;

    if (!ignore.harvest_frames) insert['frames'] = req.body.harvest_amount_calc;
    if (!ignore.harvest_water) insert['water'] = req.body.harvest_water;
    if (!ignore.harvest_charge) insert['charge'] = req.body.harvest_charge;

    if (!ignore.url) insert['url'] = req.body.url;
    if (!ignore.note) insert['note'] = req.body.note;
    if (!ignore.done) insert['done'] = req.body.done;

    try {
      const result = await Harvest.transaction(async (trx) => {
        return await Harvest.query(trx)
          .patch(insert)
          .findByIds(ids)
          .leftJoinRelated('harvest_apiary')
          .where('harvest_apiary.user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async batchGet(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Harvest.transaction(async (trx) => {
        const res = await Harvest.query(trx)
          .findByIds(req.body.ids)
          .withGraphJoined('harvest_apiary')
          .withGraphJoined('type')
          .withGraphJoined('hive')
          .where('harvest_apiary.user_id', req.user.user_id);
        return res;
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async post(req: IUserRequest, res: Response, next: NextFunction) {
    const hive_ids = req.body.hive;
    const interval = req.body.interval;
    const repeat = req.body.repeat;

    const insert = {
      date: req.body.date,
      enddate: req.body.enddate,

      type_id: req.body.type,
      amount: req.body.amount_calc,
      frames: req.body.harvest_amount_calc,

      water: req.body.harvest_water,
      charge: req.body.harvest_charge,

      url: req.body.url,
      note: req.body.note,
      done: req.body.done
    };

    try {
      const result = await Harvest.transaction(async (trx) => {
        const hives = await Hive.query(trx)
          .distinct('hives.id')
          .findByIds(hive_ids)
          .leftJoinRelated('apiaries')
          .where('apiaries.user_id', req.user.user_id);

        const result = [];
        for (const hive in hives) {
          const res = await Harvest.query(trx).insert({
            ...insert,
            hive_id: hives[hive].id,
            bee_id: req.user.bee_id
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
              const res = await Harvest.query(trx).insert({
                ...insert,
                hive_id: hives[hive].id,
                bee_id: req.user.bee_id
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
      const result = await Harvest.transaction(async (trx) => {
        return Harvest.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            done: req.body.status
          })
          .findByIds(req.body.ids)
          .leftJoinRelated('harvest_apiary')
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
      const result = await Harvest.transaction(async (trx) => {
        return Harvest.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            date: req.body.start,
            enddate: req.body.end
          })
          .findByIds(req.body.ids)
          .leftJoinRelated('harvest_apiary')
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
  async batchDelete(req: IUserRequest, res: Response, next: NextFunction) {
    const hardDelete = req.query.hard ? true : false;

    try {
      const result = await Harvest.transaction(async (trx) => {
        const res = await Harvest.query(trx)
          .findByIds(req.body.ids)
          .select('id', 'deleted')
          .withGraphJoined('harvest_apiary')
          .where('user_id', req.user.user_id);

        const softIds = [];
        const hardIds = [];
        map(res, (obj) => {
          if (obj.deleted || hardDelete) hardIds.push(obj.id);
          else softIds.push(obj.id);
        });

        if (hardIds.length > 0)
          await Harvest.query(trx).delete().whereIn('id', hardIds);
        if (softIds.length > 0)
          await Harvest.query(trx)
            .patch({
              deleted: true,
              edit_id: req.user.bee_id
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
