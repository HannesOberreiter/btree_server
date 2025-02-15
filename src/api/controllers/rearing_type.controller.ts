import type { FastifyReply, FastifyRequest } from 'fastify';
import { Rearing } from '../models/rearing/rearing.model.js';
import { RearingStep } from '../models/rearing/rearing_step.model.js';
import { RearingType } from '../models/rearing/rearing_type.model.js';

export default class RearingTypeController {
  static async get(req: FastifyRequest, _reply: FastifyReply) {
    const { order, direction, offset, limit, q } = req.query as any;
    const query = RearingType.query()
      .withGraphFetched('step(orderByPosition).detail')
      .where({
        'rearing_types.user_id': req.session.user.user_id,
      })
      .page(offset || 0, limit === 0 || !limit ? 10 : limit);

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
          builder.orWhere('rearing_types.name', 'like', `%${search}%`);
        });
      }
    }
    const result = await query.orderBy('id');
    return { ...result };
  }

  static async patch(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const ids = body.ids;
    const insert = { ...body.data };
    const result = await RearingType.transaction(async (trx) => {
      return await RearingType.query(trx)
        .patch({ ...insert })
        .findByIds(ids)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }

  static async post(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const result = await RearingType.transaction(async (trx) => {
      return await RearingType.query(trx).insert({
        ...body,
        user_id: req.session.user.user_id,
      });
    });
    return { ...result };
  }

  static async batchGet(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const result = await RearingType.transaction(async (trx) => {
      const res = await RearingType.query(trx)
        .withGraphFetched('detail')
        .findByIds(body.ids)
        .where('rearing_types.user_id', req.session.user.user_id);
      return res;
    });
    return result;
  }

  static async batchDelete(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const result = await RearingType.transaction(async (trx) => {
      await RearingStep.query(trx)
        .withGraphJoined('type')
        .delete()
        .where('type.user_id', req.session.user.user_id)
        .whereIn('type_id', body.ids);

      await Rearing.query(trx)
        .delete()
        .where('rearings.user_id', req.session.user.user_id)
        .whereIn('type_id', body.ids);

      return await RearingType.query(trx)
        .delete()
        .whereIn('id', body.ids)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }
}
