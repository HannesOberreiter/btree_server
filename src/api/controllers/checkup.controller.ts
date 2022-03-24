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

  async patch(req: IUserRequest, res: Response, next: NextFunction) {
    const ids = req.body.ids;
    const ignore = req.body.ignore;
    const insert = {};

    if (!ignore.date) insert['date'] = req.body.date;
    if (!ignore.date) insert['enddate'] = req.body.enddate;
    if (!ignore.type) insert['type_id'] = req.body.type;

    if (!ignore.url) insert['url'] = req.body.url;
    if (!ignore.note) insert['note'] = req.body.note;
    if (!ignore.done) insert['done'] = req.body.done;

    if (!ignore.queen) {
      insert['queen'] = includes(req.body.checkup_queen, 'queen');
      insert['queencells'] = includes(req.body.checkup_queen, 'queencells');
      insert['eggs'] = includes(req.body.checkup_queen, 'eggs');
      insert['capped_brood'] = includes(req.body.checkup_queen, 'capped_brood');
    }

    if (!ignore.checkup_rating.brood)
      insert['brood'] = req.body.checkup_rating.brood;
    if (!ignore.checkup_rating.pollen)
      insert['pollen'] = req.body.checkup_rating.pollen;
    if (!ignore.checkup_rating.comb)
      insert['comb'] = req.body.checkup_rating.comb;
    if (!ignore.checkup_rating.temper)
      insert['temper'] = req.body.checkup_rating.temper;
    if (!ignore.checkup_rating.calm_comb)
      insert['calm_comb'] = req.body.checkup_rating.calm_comb;
    if (!ignore.checkup_rating.swarm)
      insert['swarm'] = req.body.checkup_rating.swarm;

    if (!ignore.checkup_frames.broodframes)
      insert['broodframes'] = req.body.checkup_frames.broodframes;
    if (!ignore.checkup_frames.honeyframes)
      insert['honeyframes'] = req.body.checkup_frames.honeyframes;
    if (!ignore.checkup_frames.foundation)
      insert['foundation'] = req.body.checkup_frames.foundation;
    if (!ignore.checkup_frames.emptyframes)
      insert['emptyframes'] = req.body.checkup_frames.emptyframes;

    if (!ignore.checkup_varroa) insert['varroa'] = req.body.checkup_varroa;
    if (!ignore.checkup_strong) insert['strong'] = req.body.checkup_strong;
    if (!ignore.checkup_temp) insert['temp'] = req.body.checkup_temp;
    if (!ignore.checkup_weight_amount)
      insert['weight'] = req.body.checkup_weight_amount;
    if (!ignore.checkup_weight_time)
      insert['time'] = req.body.checkup_weight_time;

    try {
      const result = await Checkup.transaction(async (trx) => {
        return await Checkup.query(trx)
          .patch(insert)
          .findByIds(ids)
          .leftJoinRelated('checkup_apiary')
          .where('checkup_apiary.user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async batchGet(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Checkup.transaction(async (trx) => {
        const res = await Checkup.query(trx)
          .findByIds(req.body.ids)
          .withGraphJoined('checkup_apiary')
          .withGraphJoined('type')
          .withGraphJoined('hive')
          .where('checkup_apiary.user_id', req.user.user_id);
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
    const hardDelete = req.query.hard ? true : false;

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
          if (obj.deleted || hardDelete) hardIds.push(obj.id);
          else softIds.push(obj.id);
        });

        if (hardIds.length > 0)
          await Checkup.query(trx).delete().whereIn('id', hardIds);
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
