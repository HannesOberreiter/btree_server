import { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';

import { Movedate } from '../models/movedate.model.js';
import { Apiary } from '../models/apiary.model.js';
import { HiveLocation } from '../models/hive_location.model.js';

export default class MovedateController {
  static async get(req: FastifyRequest, reply: FastifyReply) {
    const { order, direction, offset, limit, q, filters } = req.query as any;
    const query = Movedate.query()
      .withGraphJoined(
        '[hive, apiary, creator(identifier), editor(identifier)]',
      )
      .where({
        'apiary.user_id': req.session.user.user_id,
      })
      // Security as we may still have some unclean data in the database were linked apiary or hive does not exist anymore
      .whereNotNull('apiary.id')
      .whereNotNull('hive.id')
      .page(offset ? offset : 0, limit === 0 || !limit ? 10 : limit);

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
            .orWhere('hive.name', 'like', `%${q}%`)
            .orWhere('apiary.name', 'like', `%${q}%`);
        });
      }
    }
    const result = await query.orderBy('id');
    return { ...result };
  }

  static async patch(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const ids = body.ids;
    const insert = { ...body.data };
    const result = await Movedate.transaction(async (trx) => {
      return await Movedate.query(trx)
        .patch({
          ...insert,
          'movedates.edit_id': req.session.user.bee_id,
        })
        .findByIds(ids)
        .leftJoinRelated('apiary')
        .where('apiary.user_id', req.session.user.user_id);
    });
    return result;
  }

  static async post(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const hive_ids = body.hive_ids;
    const insert = {
      apiary_id: body.apiary_id,
      date: body.date,
    };
    const result = await Movedate.transaction(async (trx) => {
      await Apiary.query(trx)
        .findByIds(insert.apiary_id)
        .throwIfNotFound()
        .where('user_id', req.session.user.user_id);

      const result = [];
      for (let i = 0; i < hive_ids.length; i++) {
        const id = hive_ids[i];

        await HiveLocation.query()
          .where({
            user_id: req.session.user.user_id,
            hive_id: id,
          })
          .throwIfNotFound();

        const res = await Movedate.query(trx).insert({
          ...insert,
          hive_id: id,
          bee_id: req.session.user.bee_id,
        });
        result.push(res.id);
      }
      return result;
    });
    return result;
  }

  static async updateDate(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const result = await Movedate.transaction(async (trx) => {
      // First checking if the movedate ids all belong to the user
      // we dont use a left join because of some hassle with ambigious fields
      const ids = await Movedate.query(trx)
        .select('movedates.id')
        .findByIds(body.ids)
        .leftJoinRelated('apiary')
        .where('user_id', req.session.user.user_id);
      const ids_array = ids.map((elem) => elem.id);
      return Movedate.query(trx)
        .patch({
          edit_id: req.session.user.bee_id,
          date: body.start,
        })
        .findByIds(ids_array);
    });
    return result;
  }

  static async batchGet(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const result = await Movedate.transaction(async (trx) => {
      const res = await Movedate.query(trx)
        .findByIds(body.ids)
        .withGraphJoined('hive')
        .withGraphJoined('apiary')
        .where('apiary.user_id', req.session.user.user_id);
      return res;
    });
    return result;
  }

  static async batchDelete(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const result = await Movedate.transaction(async (trx) => {
      return await Movedate.query(trx)
        .delete()
        .withGraphJoined('apiary')
        .withGraphJoined('movedate_count')
        .whereIn('movedates.id', body.ids)
        .where('user_id', req.session.user.user_id)
        .where('count', '>', 1); // User is not allowed to delete the last movedate
    });
    if (result === 0) {
      throw httpErrors.Forbidden('lastMovement'); // this specific key is used in frontend to show a specific error message
    }
    return result;
  }
}
