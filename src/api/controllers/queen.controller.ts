import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Queen } from '../models/queen.model';
import { map } from 'lodash';
import dayjs from 'dayjs';

export class QueenController extends Controller {
  constructor() {
    super();
  }

  async get(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, offset, limit, modus, deleted, q, details } =
        req.query as any;
      const query = Queen.query()
        .withGraphFetched('hive')
        .where({
          'queens.user_id': req.user.user_id,
          'queens.deleted': deleted === 'true'
        })
        .page(offset, parseInt(limit) === 0 ? 10 : limit);

      if (modus !== 'null') {
        query.where('queens.modus', modus === 'true');
      }

      if (details === 'true') {
        query
          .withGraphJoined('queen_location')
          .withGraphJoined('race')
          .withGraphJoined('mating')
          .withGraphJoined('mothers')
          .withGraphJoined('creator')
          .withGraphJoined('editor');
      }

      if (Array.isArray(order)) {
        order.forEach((field, index) => query.orderBy(field, direction[index]));
      } else {
        query.orderBy(order, direction);
      }

      if (q.trim() !== '') {
        query.where((builder) => {
          builder.orWhere('name', 'like', `%${q}%`);
        });
      }

      const result = await query.orderBy('id');
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

      const result = await Queen.transaction(async (trx) => {
        const result = [];
        for (let i = 0; i < repeat; i++) {
          const name = repeat > 1 ? req.body.name + (start + i) : req.body.name;
          const res = await Queen.query(trx).insert({
            ...insert,
            name: name,
            user_id: req.user.user_id,
            bee_id: req.user.bee_id
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
