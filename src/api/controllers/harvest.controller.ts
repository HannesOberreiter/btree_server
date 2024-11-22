import type { FastifyReply, FastifyRequest } from 'fastify';
import dayjs from 'dayjs';
import { map } from 'lodash-es';

import { Harvest } from '../models/harvest.model.js';
import { Hive } from '../models/hive.model.js';

export default class HarvestController {
  static async get(req: FastifyRequest, _reply: FastifyReply) {
    const { order, direction, offset, limit, q, filters, deleted, done }
      = req.query as any;
    const query = Harvest.query()
      .withGraphJoined(
        '[harvest_apiary, type, hive, creator(identifier), editor(identifier)]',
      )
      .where({
        'hive.deleted': false,
        'harvests.user_id': req.session.user.user_id,
        'harvests.deleted': deleted === true,
      })
      .page(offset || 0, limit === 0 || !limit ? 10 : limit);

    if (done) {
      query.where('harvests.done', done === 'true');
    }

    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          filtering.forEach((v) => {
            if ('date' in v && typeof v.date === 'object') {
              query.whereBetween('date', [v.date.from, v.date.to]);
            }
            else {
              query.where(v);
            }
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
            .orWhere('hive.name', 'like', `%${search}%`)
            .orWhere('type.name', 'like', `%${search}%`)
            .orWhere('harvests.charge', 'like', `%${search}%`);
        });
      }
    }
    const result = await query.orderBy(['hive_id', 'id']);
    return { ...result };
  }

  static async patch(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const ids = body.ids;
    const insert = { ...body.data };
    const result = await Harvest.transaction(async (trx) => {
      return await Harvest.query(trx)
        .patch({ ...insert, edit_id: req.session.user.bee_id })
        .findByIds(ids)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }

  static async post(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const hive_ids = body.hive_ids;
    const interval = body.interval;
    const repeat = body.repeat;

    const insert = body;
    delete insert.hive_ids;
    delete insert.interval;
    delete insert.repeat;

    const result = await Harvest.transaction(async (trx) => {
      const hives = await Hive.query(trx)
        .distinct('hives.id')
        .findByIds(hive_ids)
        .leftJoinRelated('apiaries')
        .where('apiaries.user_id', req.session.user.user_id);

      const result = [];
      for (const hive in hives) {
        const res = await Harvest.query(trx).insert({
          ...insert,
          hive_id: hives[hive].id,
          bee_id: req.session.user.bee_id,
          user_id: req.session.user.user_id,
        });
        result.push(res.id);

        if (repeat > 0) {
          const insert_repeat = { ...insert };
          for (let i = 0; i < repeat; i++) {
            insert_repeat.date = dayjs(insert_repeat.date)
              .add(interval, 'days')
              .format('YYYY-MM-DD');
            insert_repeat.enddate = dayjs(insert_repeat.enddate)
              .add(interval, 'days')
              .format('YYYY-MM-DD');
            const res = await Harvest.query(trx).insert({
              ...insert_repeat,
              hive_id: hives[hive].id,
              bee_id: req.session.user.bee_id,
              user_id: req.session.user.user_id,
            });
            result.push(res.id);
          }
        }
      }
      return result;
    });
    return result;
  }

  static async updateStatus(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const result = await Harvest.transaction(async (trx) => {
      return Harvest.query(trx)
        .patch({
          edit_id: req.session.user.bee_id,
          done: body.status,
        })
        .findByIds(body.ids)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }

  static async updateDate(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const result = await Harvest.transaction(async (trx) => {
      return Harvest.query(trx)
        .patch({
          edit_id: req.session.user.bee_id,
          date: body.start,
          enddate: body.end,
        })
        .findByIds(body.ids)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }

  static async batchGet(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const result = await Harvest.transaction(async (trx) => {
      const res = await Harvest.query(trx)
        .findByIds(body.ids)
        .withGraphJoined('[type, hive]')
        .where('harvests.user_id', req.session.user.user_id);
      return res;
    });
    return result;
  }

  static async batchDelete(req: FastifyRequest, _reply: FastifyReply) {
    const q = req.query as any;
    const body = req.body as any;
    const hardDelete = !!q.hard;
    const restoreDelete = !!q.restore;

    const result = await Harvest.transaction(async (trx) => {
      const res = await Harvest.query(trx)
        .findByIds(body.ids)
        .select('id', 'deleted')
        .where('user_id', req.session.user.user_id);

      const softIds = [];
      const hardIds = [];
      map(res, (obj) => {
        if ((obj.deleted || hardDelete) && !restoreDelete)
          hardIds.push(obj.id);
        else softIds.push(obj.id);
      });

      if (hardIds.length > 0)
        await Harvest.query(trx).delete().whereIn('id', hardIds);
      if (softIds.length > 0) {
        await Harvest.query(trx)
          .patch({
            deleted: !restoreDelete,
            edit_id: req.session.user.bee_id,
          })
          .findByIds(softIds);
      }

      return res;
    });
    return result;
  }
}
