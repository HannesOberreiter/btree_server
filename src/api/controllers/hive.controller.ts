import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Hive } from '../models/hive.model';
import { HiveLocation } from '../models/hive_location.model';
import { Movedate } from '../models/movedate.model';
import { Apiary } from '../models/apiary.model';
import { conflict } from '@hapi/boom';
import { map } from 'lodash';
import dayjs from 'dayjs';
import { deleteHiveConnections } from '../utils/delete.util';

export class HiveController extends Controller {
  constructor() {
    super();
  }

  async post(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const start = parseInt(req.body.start);
      const repeat =
        parseInt(req.body.repeat) > 1 ? parseInt(req.body.repeat) : 1;

      const insertMovement = {
        apiary_id: req.body.apiary_id,
        date: req.body.date,
      };

      const insert = {
        position: req.body.position,
        type_id: req.body.type_id,
        source_id: req.body.source_id,
        grouphive: req.body.grouphive,
        note: req.body.note,
        modus: req.body.modus,
        modus_date: req.body.modus_date,
      };

      const result = await Hive.transaction(async (trx) => {
        await Apiary.query(trx)
          .findByIds(insertMovement.apiary_id)
          .throwIfNotFound()
          .where('user_id', req.user.user_id);

        const result = [];
        for (let i = 0; i < repeat; i++) {
          const name = repeat > 1 ? req.body.name + (start + i) : req.body.name;
          const checkDuplicate = await HiveLocation.query().where({
            user_id: req.user.user_id,
            hive_name: name,
          });
          if (checkDuplicate.length > 0) throw conflict('name');

          const res = await Hive.query(trx).insert({
            ...insert,
            name: name,
            bee_id: req.user.bee_id,
          });
          await Movedate.query(trx).insert({
            ...insertMovement,
            hive_id: res.id,
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
      } = req.query as any;
      const query = Hive.query()
        .withGraphJoined('hive_location.[movedate]')
        .where({
          'hive_location.user_id': req.user.user_id,
          'hives.modus': modus === 'true',
          'hives.deleted': deleted === 'true',
        })
        .page(offset, parseInt(limit) === 0 ? 10 : limit);

      if (details === 'true') {
        query.withGraphJoined(
          '[queen_location, hive_source, hive_type, creator(identifier), editor(identifier)]'
        );
      }

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

      if (Array.isArray(order)) {
        order.forEach((field, index) => query.orderBy(field, direction[index]));
      } else {
        query.orderBy(order, direction);
      }

      if (q.trim() !== '') {
        query.where((builder) => {
          builder
            .orWhere('hives.name', 'like', `%${q}%`)
            .orWhere('hive_location.apiary_name', 'like', `%${q}%`);
        });
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
      const result = await Hive.transaction(async (trx) => {
        if ('name' in req.body.data) {
          if (ids.length > 1) throw conflict('name');
          const checkDuplicate = await HiveLocation.query().where({
            user_id: req.user.user_id,
            hive_name: req.body.data.name,
          });
          if (checkDuplicate.length > 1) throw conflict('name');
        }

        return await Hive.query(trx)
          .patch(insert)
          .findByIds(ids)
          .leftJoinRelated('hive_location')
          .where('hive_location.user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async updateStatus(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Hive.transaction(async (trx) => {
        return Hive.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            modus: req.body.status,
            modus_date: dayjs().format('YYYY-MM-DD'),
          })
          .findByIds(req.body.ids)
          .leftJoinRelated('hive_location')
          .where('hive_location.user_id', req.user.user_id);
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
      const result = await Hive.transaction(async (trx) => {
        const res = await HiveLocation.query()
          .select('hive_id', 'hive_deleted')
          .where('user_id', req.user.user_id)
          .whereIn('hive_id', req.body.ids);

        const softIds = [];
        const hardIds = [];
        map(res, (obj) => {
          if ((obj.hive_deleted || hardDelete) && !restoreDelete)
            hardIds.push(obj.hive_id);
          else softIds.push(obj.hive_id);
        });

        if (hardIds.length > 0) {
          await Hive.query(trx).delete().whereIn('id', hardIds);
          await deleteHiveConnections(hardIds, trx);
        }
        if (softIds.length > 0)
          await Hive.query(trx)
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
      const result = await Hive.query()
        .withGraphJoined('hive_location')
        .findByIds(req.body.ids)
        .where({
          'hive_location.user_id': req.user.user_id,
        });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
