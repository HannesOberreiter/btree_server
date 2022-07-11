import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { MySQLServer } from '@/servers/mysql.server';
import { hiveCountApiary, hiveCountTotal } from '../utils/statistic.util';
import { Harvest } from '../models/harvest.model';

export class StatisticController extends Controller {
  constructor() {
    super();
  }

  async getHive(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const kind = req.params.kind;
      let view = '';
      switch (kind) {
        case 'harvest': {
          view = 'stats_hives_harvests';
          break;
        }
        case 'feed': {
          view = 'stats_hives_feeds';
          break;
        }
        default:
          view = 'stats_hives_harvests';
      }

      const { filters } = req.query as any;
      const query = MySQLServer.knex(view)
        .where({
          user_id: req.user.user_id,
        })
        .orderBy('year', 'desc')
        .orderBy('quarter', 'desc');

      if (filters) {
        try {
          const filtering = JSON.parse(filters);
          if (Array.isArray(filtering)) {
            filtering.forEach((v) => {
              query.where(v);
            });
          }
        } catch (e) {
          console.log(e);
        }
      }
      const result = await query;
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async getHiveCountTotal(
    req: IUserRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await hiveCountTotal(req.user.user_id);
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
  async getHiveCountApiary(
    req: IUserRequest,
    res: Response,
    next: NextFunction
  ) {
    let date = new Date();
    try {
      date = new Date(req.query.date as string);
    } catch (e) {
      console.error(e);
    }
    try {
      const result = await hiveCountApiary(date, req.user.user_id);
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async getHarvestHive(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, offset, limit, q, filters } = req.query as any;

      const query = Harvest.query()
        .select(Harvest.raw('YEAR(date) as year'), 'hive_id')
        .sum('amount as amount_sum')
        .sum('frames as frames_sum')
        .avg('amount as amount_avg')
        .avg('frames as frames_avg')
        .avg('water as water_avg')
        .withGraphJoined('hive')
        .groupBy('hive_id', 'year')
        .where({
          'hive.deleted': false,
          'harvests.deleted': false,
          'harvests.user_id': req.user.user_id,
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
      if (q) {
        if (q.trim() !== '') {
          query.where((builder) => {
            builder.orWhere('hive.name', 'like', `%${q}%`);
          });
        }
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
      const result = await query.orderBy('hive.name');
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
