import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Queen } from '../models/queen.model';
import { map } from 'lodash';
import dayjs from 'dayjs';
import { QueenDuration } from '../models/queen_duration.model';
import { Checkup } from '../models/checkup.model';
import { Harvest } from '../models/harvest.model';

export class QueenController extends Controller {
  constructor() {
    super();
  }

  async get(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const {
        order,
        direction,
        offset,
        limit,
        modus,
        deleted,
        q,
        details,
        filters,
        latest,
      } = req.query as any;
      const query = Queen.query()
        .where({
          'queens.user_id': req.user.user_id,
          'queens.deleted': deleted === 'true',
        })
        .page(
          offset ? offset : 0,
          parseInt(limit) === 0 || !limit ? 10 : limit
        );

      if (modus) {
        query.where('queens.modus', modus === 'true');
      }

      if (details === 'true') {
        query.withGraphJoined(
          '[hive_location,queen_location,race,mating,own_mother,creator(identifier),editor(identifier)]'
        );
        if (latest === 'true') {
          query.whereNotNull('queen_location.queen_id');
        } else if (latest === 'false') {
          query.whereNull('queen_location.queen_id');
        }
      } else {
        query.withGraphJoined('hive_location');
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

      if (filters) {
        try {
          const filtering = JSON.parse(filters);
          if (Array.isArray(filtering)) {
            filtering.forEach((v) => {
              if ('queens.date' in v && typeof v['queens.date'] === 'object') {
                query.whereBetween('queens.date', [
                  v['queens.date'].from,
                  v['queens.date'].to,
                ]);
              } else {
                if (v['queens.hive_id'] === 'empty') {
                  query.whereNull('hive_location.hive_id');
                } else {
                  query.where(v);
                }
              }
            });
          }
        } catch (e) {
          console.log(e);
        }
      }
      if (q) {
        if (q.trim() !== '') {
          query.where((builder) => {
            builder.orWhere('queens.name', 'like', `%${q}%`);
            builder.orWhere('hive_location.hive_name', 'like', `%${q}%`);
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

  async getPedigree(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const queen = await Queen.query()
        .withRecursive('mothers', (qb) => {
          qb.from('queens')
            .select(
              'queens.name',
              'queens.id',
              'mother_id',
              'date',
              'mark_colour',
              'mother',
              'queen_matings.name as mating',
              'queen_races.name as race'
            )
            .where({
              'queens.user_id': req.user.user_id,
              'queens.id': req.params.id,
            })
            .leftJoin('queen_matings', 'mating_id', 'queen_matings.id')
            .leftJoin('queen_races', 'race_id', 'queen_races.id')

            .unionAll((qb) => {
              qb.select(
                'queens.name',
                'queens.id',
                'queens.mother_id',
                'queens.date',
                'queens.mark_colour',
                'queens.mother',
                'queen_matings.name as mating',
                'queen_races.name as race'
              )
                .from('queens')
                .leftJoin(
                  'queen_matings',
                  'queens.mating_id',
                  'queen_matings.id'
                )
                .leftJoin('queen_races', 'race_id', 'queen_races.id')
                .innerJoin('mothers', 'queens.id', 'mothers.mother_id');
            });
        })
        .select('*')
        .from('mothers');

      res.locals.data = queen;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async getStats(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, offset, limit, q, filters } = req.query as any;
      const query = QueenDuration.query();
      query
        .withGraphJoined('[queen as queens, hive_location]')
        .where({
          'queen_durations.user_id': req.user.user_id,
        })
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

      if (filters) {
        try {
          const filtering = JSON.parse(filters);
          if (Array.isArray(filtering)) {
            filtering.forEach((v) => {
              if (
                'queens.move_date' in v &&
                typeof v['queens.move_date'] === 'object'
              ) {
                query.whereBetween('queens.move_date', [
                  v['queens.move_date'].from,
                  v['queens.move_date'].to,
                ]);
              } else {
                if (v['queens.hive_id'] === 'empty') {
                  query.whereNull('hive_location.hive_id');
                } else {
                  query.where(v);
                }
              }
            });
          }
        } catch (e) {
          console.log(e);
        }
      }
      if (q) {
        if (q.trim() !== '') {
          query.where((builder) => {
            builder.orWhere('queens.name', 'like', `%${q}%`);
            builder.orWhere('hive_location.hive_name', 'like', `%${q}%`);
          });
        }
      }

      const result = await query.orderBy('id');

      for (let index = 0; index < result['results'].length; index++) {
        const queen = result['results'][index];
        const query_checkup = await Checkup.query()
          .first()
          .select(
            Checkup.raw('AVG(NULLIF(brood, 0)) as brood'),
            Checkup.raw('AVG(NULLIF(pollen, 0)) as pollen'),
            Checkup.raw('AVG(NULLIF(comb, 0)) as comb'),
            Checkup.raw('AVG(NULLIF(temper, 0)) as temper'),
            Checkup.raw('AVG(NULLIF(calm_comb, 0)) as calm_comb'),
            Checkup.raw('AVG(NULLIF(swarm, 0)) as swarm'),
            Checkup.raw('AVG(NULLIF(varroa, 0)) as varroa'),
            Checkup.raw('AVG(NULLIF(strong, 0)) as strong')
          )
          .where('hive_id', queen.hive_id)
          .whereBetween('date', [queen.move_date, queen.last_date]);

        const query_harvest = await Harvest.query()
          .first()
          .sum('frames as frames')
          .sum('amount as amount')
          .where('hive_id', queen.hive_id)
          .whereBetween('date', [queen.move_date, queen.last_date]);

        queen.checkup = query_checkup;
        queen.harvest = query_harvest;
      }
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async post(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const start = parseInt(req.body.start);
      const repeat =
        parseInt(req.body.repeat) > 1 ? parseInt(req.body.repeat) : 1;

      const insert = { ...req.body };
      delete insert.start;
      delete insert.repeat;
      delete insert.name;
      delete insert.hive_id;

      const result = await Queen.transaction(async (trx) => {
        const result = [];
        for (let i = 0; i < repeat; i++) {
          const name = repeat > 1 ? req.body.name + (start + i) : req.body.name;
          const hive_id = req.body.hive_id ? req.body.hive_id[i] : null;
          const res = await Queen.query(trx).insert({
            ...insert,
            name: name,
            hive_id: hive_id,
            user_id: req.user.user_id,
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

  async patch(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const ids = req.body.ids;
      const insert = { ...req.body.data };
      if (insert.hive_id) {
        insert.hive_id = insert.hive_id !== 'empty' ? insert.hive_id : null;
      }
      const result = await Queen.transaction(async (trx) => {
        return await Queen.query(trx)
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

  async updateStatus(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Queen.transaction(async (trx) => {
        return Queen.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            modus: req.body.status,
            modus_date: dayjs().format('YYYY-MM-DD'),
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
    const hardDelete = req.query.hard ? true : false;
    const restoreDelete = req.query.restore ? true : false;

    try {
      const result = await Queen.transaction(async (trx) => {
        const res = await Queen.query()
          .select('id', 'deleted')
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
          await Queen.query(trx).delete().whereIn('id', hardIds);
        }
        if (softIds.length > 0)
          await Queen.query(trx)
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
      const result = await Queen.query().findByIds(req.body.ids).where({
        user_id: req.user.user_id,
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
