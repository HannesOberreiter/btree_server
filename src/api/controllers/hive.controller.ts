import { FastifyRequest, FastifyReply } from 'fastify';
import httpErrors from 'http-errors';
import { map } from 'lodash-es';
import dayjs from 'dayjs';

import { Hive } from '../models/hive.model.js';
import { Movedate } from '../models/movedate.model.js';
import { Apiary } from '../models/apiary.model.js';
import { deleteHiveConnections } from '../utils/delete.util.js';
import { HiveLocation } from '../models/hive_location.model.js';
import { Harvest } from '../models/harvest.model.js';
import { Feed } from '../models/feed.model.js';
import { Treatment } from '../models/treatment.model.js';
import { Checkup } from '../models/checkup.model.js';
import { limitHive } from '../utils/premium.util.js';

async function isDuplicateHiveName(user_id: number, name: string, id?: number) {
  const checkDuplicate = Hive.query().select('id').findOne({
    user_id,
    name,
    deleted: false,
    modus: true,
  });
  if (id) {
    checkDuplicate.whereNot('id', id);
  }
  const result = await checkDuplicate;
  if (result?.id) return true;
  return false;
}

export default class HiveController {
  static async get(req: FastifyRequest, reply: FastifyReply) {
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
        'hives.user_id': req.session.user.user_id,
        'hives.deleted': deleted === 'true',
      })
      .page(offset ? offset : 0, parseInt(limit) === 0 || !limit ? 10 : limit);

    if (modus) {
      query.where('hives.modus', modus === 'true');
    }

    if (details === 'true') {
      query.withGraphJoined(
        '[hive_location.[movedate], queen_location, hive_source, hive_type, creator(identifier), editor(identifier)]',
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
        req.log.error(e);
      }
    }
    if (order) {
      if (Array.isArray(order)) {
        order.forEach((field, index) => query.orderBy(field, direction[index]));
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
    return { ...result };
  }

  static async post(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const start = parseInt(body.start);
    const repeat = parseInt(body.repeat) > 1 ? parseInt(body.repeat) : 1;

    const insertMovement = {
      apiary_id: body.apiary_id,
      date: body.date,
    };

    const insert = {
      position: body.position,
      type_id: body.type_id,
      source_id: body.source_id,
      grouphive: body.grouphive,
      note: body.note,
      modus: body.modus,
      modus_date: body.modus_date,
    };

    const limit = await limitHive(req.session.user.user_id, repeat);
    if (limit) {
      throw httpErrors.PaymentRequired('no premium access');
    }

    const result = await Hive.transaction(async (trx) => {
      await Apiary.query(trx)
        .findByIds(insertMovement.apiary_id)
        .throwIfNotFound()
        .where('user_id', req.session.user.user_id);

      const result = [];
      for (let i = 0; i < repeat; i++) {
        const name = repeat > 1 ? body.name + (start + i) : body.name;

        if (await isDuplicateHiveName(req.session.user.user_id, name)) {
          throw httpErrors.Conflict('name');
        }

        const res = await Hive.query(trx).insert({
          ...insert,
          name: name,
          bee_id: req.session.user.bee_id,
          user_id: req.session.user.user_id,
        });
        await Movedate.query(trx).insert({
          ...insertMovement,
          hive_id: res.id,
          bee_id: req.session.user.bee_id,
        });
        result.push(res.id);
      }
      return result;
    });
    return result;
  }

  static async getDetail(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as any;
    const id = params.id;
    const query = Hive.query()
      .findById(id)
      .where({
        'hives.user_id': req.session.user.user_id,
        'hives.deleted': false,
      })
      .withGraphFetched(
        '[hive_location.[movedate], queen_location.[queen.[race, mating]], hive_source, hive_type, creator(identifier), editor(identifier)]',
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

    return {
      ...result,
      sameLocation: query_apiary,
      firstMovedate: query_first,
    };
  }

  static async getTasks(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as any;
    const q = req.query as any;
    const id = params.id;
    const year = q.year ? q.year : new Date().getFullYear();
    const apiary = q.apiary ? q.apiary : false;

    const result = await Hive.transaction(async (trx) => {
      let hives = [];
      if (apiary) {
        await Apiary.query(trx).findById(id).throwIfNotFound().where({
          'apiaries.user_id': req.session.user.user_id,
          'apiaries.deleted': false,
        });
        const query_hives = await HiveLocation.query().select('hive_id').where({
          apiary_id: id,
          hive_deleted: false,
          hive_modus: true,
        });
        hives = query_hives.map((hive) => hive.hive_id);
      } else {
        await Hive.query(trx).findById(id).throwIfNotFound().where({
          'hives.user_id': req.session.user.user_id,
          'hives.deleted': false,
        });
        hives.push(id);
      }

      const harvest = await Harvest.query()
        .select('*', Hive.raw('? as kind', ['harvest']))
        .withGraphFetched(
          '[hive, harvest_apiary, type, creator(identifier), editor(identifier)]',
        )
        .whereIn('hive_id', hives)
        .where({
          deleted: false,
        })
        .whereRaw('YEAR(date) = ?', year)
        .orderBy('date', 'desc');
      const feed = await Feed.query()
        .select('*', Hive.raw('? as kind', ['feed']))
        .withGraphFetched(
          '[hive, feed_apiary, type, creator(identifier), editor(identifier)]',
        )
        .whereIn('hive_id', hives)
        .where({
          deleted: false,
        })
        .whereRaw('YEAR(date) = ?', year)
        .orderBy('date', 'desc');
      const treatment = await Treatment.query()
        .select('*', Hive.raw('? as kind', ['treatment']))
        .withGraphFetched(
          '[hive, treatment_apiary, type, disease, vet, creator(identifier), editor(identifier)]',
        )
        .whereIn('hive_id', hives)
        .where({
          deleted: false,
        })
        .whereRaw('YEAR(date) = ?', year)
        .orderBy('date', 'desc');
      const checkup = await Checkup.query()
        .select('*', Hive.raw('? as kind', ['checkup']))
        .withGraphFetched(
          '[hive, checkup_apiary, type, creator(identifier), editor(identifier)]',
        )
        .whereIn('hive_id', hives)
        .where({
          deleted: false,
        })
        .whereRaw('YEAR(date) = ?', year)
        .orderBy('date', 'desc');
      const movedate = await Movedate.query()
        .select('*', Hive.raw('? as kind', ['movedate']))
        .withGraphFetched(
          '[hive, apiary, creator(identifier), editor(identifier)]',
        )
        .whereIn('hive_id', hives)
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
    return { ...result };
  }

  static async patch(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const ids = body.ids;
    const insert = { ...body.data };
    const result = await Hive.transaction(async (trx) => {
      if ('name' in body.data) {
        if (ids.length > 1) {
          throw httpErrors.Conflict('name');
        }
        if (
          await isDuplicateHiveName(
            req.session.user.user_id,
            insert.name,
            ids[0],
          )
        ) {
          throw httpErrors.Conflict('name');
        }
      }

      return await Hive.query(trx)
        .patch({ ...insert, edit_id: req.session.user.bee_id })
        .findByIds(ids)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }

  static async updateStatus(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const result = await Hive.transaction(async (trx) => {
      return Hive.query(trx)
        .patch({
          edit_id: req.session.user.bee_id,
          modus: body.status,
          modus_date: dayjs().format('YYYY-MM-DD'),
        })
        .findByIds(body.ids)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }

  static async batchDelete(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const q = req.query as any;
    const hardDelete = q.hard ? true : false;
    const restoreDelete = q.restore ? true : false;

    const result = await Hive.transaction(async (trx) => {
      const res = await Hive.query()
        .select('id', 'deleted')
        .where('user_id', req.session.user.user_id)
        .whereIn('id', body.ids);

      const softIds = [];
      const hardIds = [];
      map(res, (obj) => {
        if ((obj.deleted || hardDelete) && !restoreDelete) hardIds.push(obj.id);
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
            edit_id: req.session.user.bee_id,
          })
          .findByIds(softIds);

      return res;
    });
    return result;
  }

  static async batchGet(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const result = await Hive.query().findByIds(body.ids).where({
      user_id: req.session.user.user_id,
    });
    return result;
  }

  static async updatePosition(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const hives = body.data;
    const result = await Hive.transaction(async (trx) => {
      const res = [];
      for (const hive of hives) {
        res.push(
          await Hive.query(trx)
            .patch({ position: hive.position })
            .findById(hive.id)
            .where('user_id', req.session.user.user_id),
        );
      }
      return res;
    });
    return result;
  }
}
