import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Apiary } from '../models/apiary.model';
import { conflict, forbidden, paymentRequired } from '@hapi/boom';
import { map } from 'lodash';
import dayjs from 'dayjs';
import { HiveLocation } from '../models/hive_location.model';
import { Movedate } from '../models/movedate.model';
import { limitApiary } from '../utils/premium.util';

async function isDuplicateApiaryName(user_id: number, name: string) {
  const checkDuplicate = await Apiary.query().select('id').findOne({
    user_id,
    name,
    deleted: false,
  });
  if (checkDuplicate?.id) return true;
  return false;
}

export default class ApiaryController extends Controller {
  constructor() {
    super();
  }

  async patch(req: IUserRequest, res: Response, next) {
    try {
      const ids = req.body.ids;
      const insert = { ...req.body.data };
      const result = await Apiary.transaction(async (trx) => {
        if (req.body.name) {
          if (ids.length > 1) throw conflict('name');
        }
        return await Apiary.query(trx)
          .patch({ ...insert, edit_id: req.user.bee_id })
          .findByIds(ids)
          .withGraphFetched('hive_count')
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async get(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, offset, limit, modus, deleted, q, details } =
        req.query as any;

      const query = Apiary.query()
        .where({
          'apiaries.user_id': req.user.user_id,
          'apiaries.deleted': deleted === 'true',
        })
        .page(
          offset ? offset : 0,
          parseInt(limit) === 0 || !limit ? 10 : limit
        );

      if (modus) {
        query.where('apiaries.modus', modus === 'true');
      }

      if (details === 'true') {
        query.withGraphJoined(
          '[hive_count, creator(identifier),editor(identifier)]'
        );
      } else {
        query.withGraphJoined('[hive_count]');
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
            builder.orWhere('name', 'like', `%${q}%`);
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

  async getDetail(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;

      const query = Apiary.query()
        .findById(id)
        .where({
          'apiaries.user_id': req.user.user_id,
          'apiaries.deleted': false,
        })
        .withGraphFetched(
          '[hive_count, creator(identifier), editor(identifier)]'
        )
        .throwIfNotFound();
      const result = await query;

      const query_others = await Apiary.query()
        .select('id', 'name')
        .where({ user_id: req.user.user_id, deleted: false, modus: true })
        .orderBy('name');

      const query_first = await Movedate.query()
        .first()
        .where('apiary_id', result.id)
        .orderBy('date', 'desc');

      const query_hives = await HiveLocation.query()
        .select(
          'hive.name as name',
          'hive.id as id',
          'position',
          'hive:queen_location.queen_name',
          'hive:queen_location.queen_modus',
          'hive:queen_location:queen.mark_colour as mark_colour'
        )
        .leftJoinRelated('hive.[queen_location.[queen]]')
        .where({
          apiary_id: result.id,
          hive_deleted: false,
          hive_modus: true,
        })
        .orderBy('hive.position')
        .orderBy('hive.name');

      res.locals.data = {
        ...result,
        firstMovedate: query_first,
        sameLocation: query_others,
        hives: query_hives,
      };
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async post(req: IUserRequest, res: Response, next) {
    try {
      const limit = await limitApiary(req.user.user_id);
      if (limit) throw paymentRequired('no premium access');

      const result = await Apiary.transaction(async (trx) => {
        if (await isDuplicateApiaryName(req.user.user_id, req.body.name))
          throw conflict('name');
        return Apiary.query(trx).insertAndFetch({
          bee_id: req.user.bee_id,
          user_id: req.user.user_id,
          ...req.body,
        });
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async updateStatus(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Apiary.transaction(async (trx) => {
        return Apiary.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            modus: req.body.status,
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
    try {
      const hardDelete = req.query.hard ? true : false;
      const restoreDelete = req.query.restore ? true : false;

      const result = await Apiary.transaction(async (trx) => {
        const res = await Apiary.query()
          .withGraphFetched('hive_count')
          .where('user_id', req.user.user_id)
          .whereIn('id', req.body.ids);

        const softIds = [];
        const hardIds = [];
        map(res, (obj) => {
          if (obj.hive_count) throw forbidden();

          if ((obj.deleted || hardDelete) && !restoreDelete)
            hardIds.push(obj.id);
          else softIds.push(obj.id);
        });

        if (hardIds.length > 0) {
          await Apiary.query(trx).delete().whereIn('id', hardIds);
        }

        if (softIds.length > 0)
          await Apiary.query(trx)
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
      const result = await Apiary.query().findByIds(req.body.ids).where({
        user_id: req.user.user_id,
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
