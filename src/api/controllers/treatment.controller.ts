import { Treatment } from '@models/treatment.model';
import { map } from 'lodash';
import { Hive } from '../models/hive.model';
import dayjs from 'dayjs';
import { FastifyReply, FastifyRequest } from 'fastify';
export default class TreatmentController {
  static async get(req: FastifyRequest, reply: FastifyReply) {
    const { order, direction, offset, limit, q, filters, deleted, done } =
      req.query as any;
    const query = Treatment.query()
      .withGraphJoined(
        '[treatment_apiary, type, disease, vet, hive, creator(identifier), editor(identifier)]',
      )
      .where({
        'hive.deleted': false,
        'treatments.deleted': deleted === 'true',
        'treatments.user_id': req.session.user.user_id,
      })
      .page(offset ? offset : 0, parseInt(limit) === 0 || !limit ? 10 : limit);

    if (done) {
      query.where('treatments.done', done === 'true');
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
      if (q.trim() !== '') {
        query.where((builder) => {
          builder
            .orWhere('hive.name', 'like', `%${q}%`)
            .orWhere('disease.name', 'like', `%${q}%`)
            .orWhere('type.name', 'like', `%${q}%`);
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
    const result = await Treatment.transaction(async (trx) => {
      return await Treatment.query(trx)
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

    const result = await Treatment.transaction(async (trx) => {
      const hives = await Hive.query(trx)
        .distinct('hives.id')
        .findByIds(hive_ids)
        .leftJoinRelated('apiaries')
        .where('apiaries.user_id', req.session.user.user_id);

      const result = [];
      for (const hive in hives) {
        const res = await Treatment.query(trx).insert({
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
            const res = await Treatment.query(trx).insert({
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
    const result = await Treatment.transaction(async (trx) => {
      return Treatment.query(trx)
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
    const result = await Treatment.transaction(async (trx) => {
      return Treatment.query(trx)
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
    const result = await Treatment.transaction(async (trx) => {
      const res = await Treatment.query(trx)
        .findByIds(body.ids)
        .withGraphJoined('[type, disease, vet, hive]')
        .where('treatments.user_id', req.session.user.user_id);
      return res;
    });
    return result;
  }

  static async batchDelete(req: FastifyRequest, reply: FastifyReply) {
    const q = req.query as any;
    const body = req.body as any;
    const hardDelete = q.hard ? true : false;
    const restoreDelete = q.restore ? true : false;

    const result = await Treatment.transaction(async (trx) => {
      const res = await Treatment.query(trx)
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
        await Treatment.query(trx).delete().whereIn('id', hardIds);
      if (softIds.length > 0)
        await Treatment.query(trx)
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
