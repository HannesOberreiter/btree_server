import { map } from 'lodash-es';
import dayjs from 'dayjs';
import { FastifyReply, FastifyRequest } from 'fastify';

import { Feed } from '../models/feed.model.js';
import { Hive } from '../models/hive.model.js';

export default class FeedController {
  static async get(req: FastifyRequest, reply: FastifyReply) {
    const { order, direction, offset, limit, q, filters, deleted, done } =
      req.query as any;
    const query = Feed.query()
      .withGraphJoined(
        '[feed_apiary, type, hive, creator(identifier), editor(identifier)]',
      )
      .where({
        'hive.deleted': false,
        'feeds.user_id': req.session.user.user_id,
        'feeds.deleted': deleted === true,
      })
      .page(offset ? offset : 0, limit === 0 || !limit ? 10 : limit);

    if (done) {
      query.where('feeds.done', done === 'true');
    }

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
      const search = '' + q; // Querystring could be converted be a number

      if (search.trim() !== '') {
        query.where((builder) => {
          builder
            .orWhere('hive.name', 'like', `%${search}%`)
            .orWhere('type.name', 'like', `%${search}%`);
        });
      }
    }
    const result = await query.orderBy(['hive_id', 'id']);
    return { ...result };
  }

  static async patch(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const ids = body.ids;
    const insert = { ...body.data };
    const result = await Feed.transaction(async (trx) => {
      return await Feed.query(trx)
        .patch({ ...insert, edit_id: req.session.user.bee_id })
        .findByIds(ids)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }

  static async post(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const hive_ids = body.hive_ids;
    const interval = body.interval;
    const repeat = body.repeat;

    const insert = body;
    delete insert.hive_ids;
    delete insert.interval;
    delete insert.repeat;

    const result = await Feed.transaction(async (trx) => {
      const hives = await Hive.query(trx)
        .distinct('hives.id')
        .findByIds(hive_ids)
        .leftJoinRelated('apiaries')
        .where('apiaries.user_id', req.session.user.user_id);

      const result = [];
      for (const hive in hives) {
        const res = await Feed.query(trx).insert({
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
            const res = await Feed.query(trx).insert({
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

  static async updateStatus(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const result = await Feed.transaction(async (trx) => {
      return Feed.query(trx)
        .patch({
          edit_id: req.session.user.bee_id,
          done: body.status,
        })
        .findByIds(body.ids)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }

  static async updateDate(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const result = await Feed.transaction(async (trx) => {
      return Feed.query(trx)
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

  static async batchGet(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const result = await Feed.transaction(async (trx) => {
      const res = await Feed.query(trx)
        .findByIds(body.ids)
        .withGraphJoined('[type, hive]')
        .where('feeds.user_id', req.session.user.user_id);
      return res;
    });
    return result;
  }

  static async batchDelete(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as any;
    const body = req.body as any;
    const hardDelete = query.hard ? true : false;
    const restoreDelete = query.restore ? true : false;

    const result = await Feed.transaction(async (trx) => {
      const res = await Feed.query(trx)
        .findByIds(body.ids)
        .select('id', 'deleted')
        .where('user_id', req.session.user.user_id);

      const softIds = [];
      const hardIds = [];
      map(res, (obj) => {
        if ((obj.deleted || hardDelete) && !restoreDelete) hardIds.push(obj.id);
        else softIds.push(obj.id);
      });

      if (hardIds.length > 0)
        await Feed.query(trx).delete().whereIn('id', hardIds);
      if (softIds.length > 0)
        await Feed.query(trx)
          .patch({
            deleted: restoreDelete ? false : true,
            edit_id: req.session.user.bee_id,
          })
          .findByIds(softIds);

      return res;
    });
    return result;
  }
}
