import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { MySQLServer } from '@/servers/mysql.server';
import { hiveCountApiary, hiveCountTotal } from '../utils/statistic.util';

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

  async getHiveCount(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      let date = req.query.date || (null as any);
      let result;
      if (!date) {
        result = await hiveCountTotal(req.user.user_id);
      } else {
        date = new Date(date as string);
        result = await hiveCountApiary(date, req.user.user_id);
      }
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
