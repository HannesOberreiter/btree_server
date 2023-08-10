import { Scale } from '../models/scale.model.js';
import { Hive } from '../models/hive.model.js';
import { ScaleData } from '../models/scale_data.model.js';
import { limitScale } from '../utils/premium.util.js';
import { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';

export default class ScaleController {
  static async get(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as any;
    const query = Scale.query()
      .withGraphFetched('hive')
      .where('user_id', req.session.user.user_id);
    if (params.id) {
      query.findById(params.id);
    }
    const result = params.id ? [await query] : await query; // array is returned to be consistent with batchGet function
    return result;
  }
  static async patch(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const ids = body.ids;
    const insert = { ...body.data };

    const result = await Scale.transaction(async (trx) => {
      if (insert.hive_id)
        await Hive.query(trx)
          .where({ id: insert.hive_id, user_id: req.session.user.user_id })
          .throwIfNotFound();

      return await Scale.query(trx)
        .patch(insert)
        .findByIds(ids)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }
  static async post(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;

    const limit = await limitScale(req.session.user.user_id);
    if (limit) {
      throw httpErrors.PaymentRequired('no premium access');
    }

    const result = await Scale.transaction(async (trx) => {
      if (body.hive_id)
        await Hive.query(trx)
          .where({ id: body.hive_id, user_id: req.session.user.user_id })
          .throwIfNotFound();

      return await Scale.query(trx).insert({
        name: body.name,
        hive_id: body.hive_id,
        user_id: req.session.user.user_id,
      });
    });
    return { ...result };
  }
  static async delete(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as any;
    const result = await Scale.transaction(async (trx) => {
      await ScaleData.query(trx).delete().joinRelated('scale').where({
        scale_id: params.id,
        'scale.user_id': req.session.user.user_id,
      });
      return await Scale.query(trx)
        .deleteById(params.id)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }
}
