import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Hive } from '../models/hive.model';

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
          view = 'stats_harvest';
          break;
        }
        default:
          view = 'stats_harvest';
      }

      const { filters } = req.query as any;
      const query = Hive.query()
        .select(`${view}.*`, 'stats_harvest:type.name as type_name')
        .leftJoinRelated(`[${view}.[type]]`)
        .where({
          'hives.deleted': false,
          'hives.user_id': req.user.user_id,
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
}
