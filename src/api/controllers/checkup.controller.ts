import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { Checkup } from '@models/checkup.model';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { map, includes } from 'lodash';
import { Hive } from '../models/hive.model';
import dayjs from 'dayjs';

export class CheckupController extends Controller {
  constructor() {
    super();
  }

  async post(req: IUserRequest, res: Response, next: NextFunction) {
    const hive_ids = req.body.hive;
    const interval = req.body.interval;
    const repeat = req.body.repeat;

    const insert = {
      date: req.body.date,
      enddate: req.body.enddate,

      type_id: req.body.type,

      queen: includes(req.body.checkup_queen, 'queen'),
      queencells: includes(req.body.checkup_queen, 'queencells'),
      eggs: includes(req.body.checkup_queen, 'eggs'),
      capped_brood: includes(req.body.checkup_queen, 'capped_brood'),

      brood: req.body.checkup_rating.brood,
      pollen: req.body.checkup_rating.pollen,
      comb: req.body.checkup_rating.comb,
      temper: req.body.checkup_rating.temper,
      calm_comb: req.body.checkup_rating.calm_comb,
      swarm: req.body.checkup_rating.swarm,

      varroa: req.body.checkup_varroa,
      strong: req.body.checkup_strong,
      temp: req.body.checkup_temp,
      weight: req.body.checkup_weight_amount,
      time: req.body.checkup_weight_time,

      broodframes: req.body.checkup_frames.broodframes,
      honeyframes: req.body.checkup_frames.honeyframes,
      foundation: req.body.checkup_frames.foundation,
      emptyframes: req.body.checkup_frames.emptyframes,

      url: req.body.url,
      note: req.body.note,
      done: req.body.done
    };

    try {
      const result = await Checkup.transaction(async (trx) => {
        const hives = await Hive.query(trx)
          .distinct('hives.id')
          .findByIds(hive_ids)
          .leftJoinRelated('apiaries')
          .where('apiaries.user_id', req.user.user_id);

        const result = [];
        for (const hive in hives) {
          const res = await Checkup.query(trx).insert({
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
              const res = await Checkup.query(trx).insert({
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
      const result = await Checkup.transaction(async (trx) => {
        return Checkup.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            done: req.body.status
          })
          .findByIds(req.body.ids)
          .leftJoinRelated('checkup_apiary')
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
      const result = await Checkup.transaction(async (trx) => {
        return Checkup.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            date: req.body.start,
            enddate: req.body.end
          })
          .findByIds(req.body.ids)
          .leftJoinRelated('checkup_apiary')
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
      const result = await Checkup.transaction(async (trx) => {
        const res = await Checkup.query(trx)
          .findByIds(req.body.ids)
          .select('id', 'deleted')
          .withGraphJoined('checkup_apiary')
          .where('user_id', req.user.user_id);

        const softIds = [];
        const hardIds = [];
        map(res, (obj) => {
          if (obj.deleted) hardIds.push(obj.id);
          else softIds.push(obj.id);
        });

        if (hardIds.length > 0) await Checkup.query(trx).deleteById(hardIds);
        if (softIds.length > 0)
          await Checkup.query(trx)
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
