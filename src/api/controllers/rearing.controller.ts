import { Rearing } from '../models/rearing/rearing.model.js';
import { FastifyReply, FastifyRequest } from 'fastify';

export default class RearingController {
  static async get(req: FastifyRequest, reply: FastifyReply) {
    const { order, direction, offset, limit, q, filters } = req.query as any;
    const query = Rearing.query()
      .withGraphJoined('[type, start]')
      .where({
        'rearings.user_id': req.session.user.user_id,
      })
      .page(offset ? offset : 0, parseInt(limit) === 0 || !limit ? 10 : limit);
    if (order) {
      if (Array.isArray(order)) {
        order.forEach((field, index) => query.orderBy(field, direction[index]));
      } else {
        query.orderBy(order, direction);
      }
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
    if (q) {
      if (q.trim() !== '') {
        query.where((builder) => {
          builder.orWhere('type.name', 'like', `%${q}%`);
          builder.orWhere('rearings.name', 'like', `%${q}%`);
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
    const result = await Rearing.transaction(async (trx) => {
      return await Rearing.query(trx)
        .patch({ ...insert, edit_id: req.session.user.bee_id })
        .findByIds(ids)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }

  static async post(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const result = await Rearing.query().insert({
      ...body,
      user_id: req.session.user.user_id,
      bee_id: req.session.user.bee_id,
    });
    return [result.id];
  }

  static async updateDate(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const result = await Rearing.transaction(async (trx) => {
      return Rearing.query(trx)
        .patch({
          edit_id: req.session.user.bee_id,
          date: body.start,
        })
        .findByIds(body.ids)
        .where('rearings.user_id', req.session.user.user_id);
    });
    return result;
  }

  static async batchDelete(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const result = await Rearing.transaction(async (trx) => {
      return Rearing.query(trx)
        .delete()
        .findByIds(body.ids)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }

  static async batchGet(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const result = await Rearing.transaction(async (trx) => {
      const res = await Rearing.query(trx)
        .findByIds(body.ids)
        .where('rearings.user_id', req.session.user.user_id);
      return res;
    });
    return result;
  }
}
