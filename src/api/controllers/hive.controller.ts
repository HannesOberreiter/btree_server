import type { FastifyReply, FastifyRequest } from 'fastify';
import type Objection from 'objection';
import dayjs from 'dayjs';
import httpErrors from 'http-errors';

import { map } from 'lodash-es';
import { Apiary } from '../models/apiary.model.js';
import { Checkup } from '../models/checkup.model.js';
import { Feed } from '../models/feed.model.js';
import { Harvest } from '../models/harvest.model.js';
import { Hive } from '../models/hive.model.js';
import { HiveLocation } from '../models/hive_location.model.js';
import { Movedate } from '../models/movedate.model.js';
import { Treatment } from '../models/treatment.model.js';
import { deleteHiveConnections } from '../utils/delete.util.js';
import { limitHive } from '../utils/premium.util.js';

async function isDuplicateHiveName(
  user_id: number,
  name: string,
  id?: number,
  trx: Objection.Transaction = null,
) {
  const checkDuplicate = Hive.query(trx).select('id').findOne({
    user_id,
    name,
    deleted: false,
    modus: true,
  });
  if (id) {
    checkDuplicate.whereNot('id', id);
  }
  const result = await checkDuplicate;
  if (result?.id)
    return true;
  return false;
}

export default class HiveController {
  static async get(req: FastifyRequest, _reply: FastifyReply) {
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
        'hives.deleted': deleted === true,
      })
      .page(offset || 0, limit === 0 || !limit ? 10 : limit);

    if (modus !== undefined && modus !== null) {
      query.where('hives.modus', modus === true);
    }

    if (details === true) {
      query.withGraphJoined(
        '[hive_location.[movedate], queen_location, hive_source, hive_type, creator(identifier), editor(identifier)]',
      );
    }
    else {
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
      }
      catch (e) {
        req.log.error(e);
      }
    }
    if (order) {
      if (Array.isArray(order)) {
        order.forEach((field, index) => query.orderBy(field, direction[index]));
      }
      else {
        query.orderBy(order, direction);
      }
    }
    if (q) {
      const search = `${q}`; // Querystring could be converted be a number

      if (search.trim() !== '') {
        query.where((builder) => {
          builder
            .orWhere('hives.name', 'like', `%${search}%`)
            .orWhere('hive_location.apiary_name', 'like', `%${search}%`);
        });
      }
    }
    const result = await query.orderBy('id');
    return { ...result };
  }

  static async post(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const start = Number.parseInt(body.start);
    const repeat = Number.parseInt(body.repeat) > 1 ? Number.parseInt(body.repeat) : 1;

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

        if (
          await isDuplicateHiveName(req.session.user.user_id, name, null, trx)
        ) {
          throw httpErrors.Conflict('name');
        }

        const res = await Hive.query(trx).insert({
          ...insert,
          name,
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

  static async getDetail(req: FastifyRequest, _reply: FastifyReply) {
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

  static async getTasks(req: FastifyRequest, _reply: FastifyReply) {
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
        const query_hives = await HiveLocation.query(trx)
          .select('hive_id')
          .where({
            apiary_id: id,
            hive_deleted: false,
            hive_modus: true,
          });
        hives = query_hives.map(hive => hive.hive_id);
      }
      else {
        await Hive.query(trx).findById(id).throwIfNotFound().where({
          'hives.user_id': req.session.user.user_id,
          'hives.deleted': false,
        });
        hives.push(id);
      }

      const harvest = await Harvest.query(trx)
        .select('*', Hive.raw('? as kind', ['harvest']))
        .withGraphFetched(
          '[hive, harvest_apiary, type, creator(identifier), editor(identifier)]',
        )
        .whereIn('hive_id', hives)
        .where({
          deleted: false,
        })
        .whereBetween('date', [`${year}-01-01`, `${year}-12-31`])
        .orderBy('date', 'desc');
      const feed = await Feed.query(trx)
        .select('*', Hive.raw('? as kind', ['feed']))
        .withGraphFetched(
          '[hive, feed_apiary, type, creator(identifier), editor(identifier)]',
        )
        .whereIn('hive_id', hives)
        .where({
          deleted: false,
        })
        .whereBetween('date', [`${year}-01-01`, `${year}-12-31`])
        .orderBy('date', 'desc');
      const treatment = await Treatment.query(trx)
        .select('*', Hive.raw('? as kind', ['treatment']))
        .withGraphFetched(
          '[hive, treatment_apiary, type, disease, vet, creator(identifier), editor(identifier)]',
        )
        .whereIn('hive_id', hives)
        .where({
          deleted: false,
        })
        .whereBetween('date', [`${year}-01-01`, `${year}-12-31`])
        .orderBy('date', 'desc');
      const checkup = await Checkup.query(trx)
        .select('*', Hive.raw('? as kind', ['checkup']))
        .withGraphFetched(
          '[hive, checkup_apiary, type, creator(identifier), editor(identifier)]',
        )
        .whereIn('hive_id', hives)
        .where({
          deleted: false,
        })
        .whereBetween('date', [`${year}-01-01`, `${year}-12-31`])
        .orderBy('date', 'desc');
      const movedate = await Movedate.query(trx)
        .select('*', Hive.raw('? as kind', ['movedate']))
        .withGraphFetched(
          '[hive, apiary, creator(identifier), editor(identifier)]',
        )
        .whereIn('hive_id', hives)
        .whereBetween('date', [`${year}-01-01`, `${year}-12-31`])
        .orderBy('date', 'desc');

      return {
        harvest,
        feed,
        treatment,
        checkup,
        movedate,
      };
    });
    return { ...result };
  }

  static async patch(req: FastifyRequest, _reply: FastifyReply) {
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
            trx,
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

  static async updateStatus(req: FastifyRequest, _reply: FastifyReply) {
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

  static async batchDelete(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const q = req.query as any;
    const hardDelete = !!q.hard;
    const restoreDelete = !!q.restore;

    const result = await Hive.transaction(async (trx) => {
      const res = await Hive.query()
        .select('id', 'deleted')
        .where('user_id', req.session.user.user_id)
        .whereIn('id', body.ids);

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
      if (softIds.length > 0) {
        await Hive.query(trx)
          .patch({
            deleted: !restoreDelete,
            deleted_at: dayjs()
              .utc()
              .toISOString()
              .slice(0, 19)
              .replace('T', ' '),
            edit_id: req.session.user.bee_id,
          })
          .findByIds(softIds);
      }

      return res;
    });
    return result;
  }

  static async batchGet(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const result = await Hive.query().findByIds(body.ids).where({
      user_id: req.session.user.user_id,
    });
    return result;
  }

  static async updatePosition(req: FastifyRequest, _reply: FastifyReply) {
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
