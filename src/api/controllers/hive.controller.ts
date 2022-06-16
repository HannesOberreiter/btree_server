import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Hive } from '../models/hive.model';
import { Movedate } from '../models/movedate.model';
import { Apiary } from '../models/apiary.model';
import { conflict, paymentRequired } from '@hapi/boom';
import { map } from 'lodash';
import dayjs from 'dayjs';
import { deleteHiveConnections } from '../utils/delete.util';
import { HiveLocation } from '../models/hive_location.model';
import { Harvest } from '../models/harvest.model';
import { Feed } from '../models/feed.model';
import { Treatment } from '../models/treatment.model';
import { Checkup } from '../models/checkup.model';
import { limitHive } from '../utils/premium.util';

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

      const limit = await limitHive(req.user.user_id, repeat);
      if (limit) throw paymentRequired('no premium access');

      const result = await Hive.transaction(async (trx) => {
        await Apiary.query(trx)
          .findByIds(insertMovement.apiary_id)
          .throwIfNotFound()
          .where('user_id', req.user.user_id);

        const result = [];
        for (let i = 0; i < repeat; i++) {
          const name = repeat > 1 ? req.body.name + (start + i) : req.body.name;
          const checkDuplicate = await Hive.query().where({
            user_id: req.user.user_id,
            name: name,
          });
          if (checkDuplicate.length > 0) throw conflict('name');

          const res = await Hive.query(trx).insert({
            ...insert,
            name: name,
            bee_id: req.user.bee_id,
            user_id: req.user.user_id,
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
        .where({
          'hives.user_id': req.user.user_id,
          'hives.deleted': deleted === 'true',
        })
        .page(
          offset ? offset : 0,
          parseInt(limit) === 0 || !limit ? 10 : limit
        );

      if (modus) {
        query.where('hives.modus', modus === 'true');
      }

      if (details === 'true') {
        query.withGraphJoined(
          '[hive_location.[movedate], queen_location, hive_source, hive_type, creator(identifier), editor(identifier)]'
        );
      } else {
        query.withGraphJoined('hive_location.[movedate]');
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
            builder
              .orWhere('hives.name', 'like', `%${q}%`)
              .orWhere('hive_location.apiary_name', 'like', `%${q}%`);
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
      const query = Hive.query()
        .findById(id)
        .where({
          'hives.user_id': req.user.user_id,
          'hives.deleted': false,
        })
        .withGraphFetched(
          '[hive_location.[movedate], queen_location.[queen.[race, mating]], hive_source, hive_type, creator(identifier), editor(identifier)]'
        )
        .throwIfNotFound();
      const result = await query;

      const query_first = await Movedate.query()
        .first()
        .where('hive_id', result.id)
        .orderBy('date', 'desc');

      const query_apiary = await HiveLocation.query()
        .select('hive.id', 'hive.position', 'hive.name')
        .leftJoinRelated('hive')
        .where({
          apiary_id: result.hive_location ? result.hive_location.apiary_id : 0,
          hive_deleted: false,
          hive_modus: true,
        })
        .orderBy('hive.position')
        .orderBy('hive.name');

      res.locals.data = {
        ...result,
        sameLocation: query_apiary,
        firstMovedate: query_first,
      };
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async getTasks(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const year = req.query.year ? req.query.year : new Date().getFullYear();
      const result = await Hive.transaction(async (trx) => {
        await Hive.query(trx).findById(id).throwIfNotFound().where({
          'hives.user_id': req.user.user_id,
          'hives.deleted': false,
        });

        const harvest = await Harvest.query()
          .select('*', Hive.raw('? as kind', ['harvest']))
          .withGraphFetched(
            '[harvest_apiary, type, creator(identifier), editor(identifier)]'
          )
          .where({
            hive_id: id,
            deleted: false,
          })
          .whereRaw('YEAR(date) = ?', year)
          .orderBy('date', 'desc');
        const feed = await Feed.query()
          .select('*', Hive.raw('? as kind', ['feed']))
          .withGraphFetched(
            '[feed_apiary, type, creator(identifier), editor(identifier)]'
          )
          .where({
            hive_id: id,
            deleted: false,
          })
          .whereRaw('YEAR(date) = ?', year)
          .orderBy('date', 'desc');
        const treatment = await Treatment.query()
          .select('*', Hive.raw('? as kind', ['treatment']))
          .withGraphFetched(
            '[treatment_apiary, type, disease, vet, creator(identifier), editor(identifier)]'
          )
          .where({
            hive_id: id,
            deleted: false,
          })
          .whereRaw('YEAR(date) = ?', year)
          .orderBy('date', 'desc');
        const checkup = await Checkup.query()
          .select('*', Hive.raw('? as kind', ['checkup']))
          .withGraphFetched(
            '[checkup_apiary, type, creator(identifier), editor(identifier)]'
          )
          .where({
            hive_id: id,
            deleted: false,
          })
          .whereRaw('YEAR(date) = ?', year)
          .orderBy('date', 'desc');
        const movedate = await Movedate.query()
          .select('*', Hive.raw('? as kind', ['movedate']))
          .withGraphFetched('[apiary, creator(identifier), editor(identifier)]')
          .where({
            hive_id: id,
          })
          .whereRaw('YEAR(date) = ?', year)
          .orderBy('date', 'desc');

        return {
          harvest: harvest,
          feed: feed,
          treatment: treatment,
          checkup: checkup,
          movedate: movedate,
        };
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
      const result = await Hive.transaction(async (trx) => {
        if ('name' in req.body.data) {
          if (ids.length > 1) throw conflict('name');
          const checkDuplicate = await Hive.query().where({
            user_id: req.user.user_id,
            name: req.body.data.name,
          });
          if (checkDuplicate.length > 1) throw conflict('name');
        }

        return await Hive.query(trx)
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
      const result = await Hive.transaction(async (trx) => {
        return Hive.query(trx)
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
      const result = await Hive.transaction(async (trx) => {
        const res = await Hive.query()
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
      const result = await Hive.query().findByIds(req.body.ids).where({
        user_id: req.user.user_id,
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async updatePosition(req: IUserRequest, res: Response, next: NextFunction) {
    const hives = req.body.data;
    try {
      const result = await Hive.transaction(async (trx) => {
        const res = [];
        for (const hive of hives) {
          res.push(
            await Hive.query(trx)
              .patch({ position: hive.position })
              .findById(hive.id)
              .where('user_id', req.user.user_id)
          );
        }
        return res;
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
