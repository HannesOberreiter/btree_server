import { checkMySQLError } from '@utils/error.util';
import { Scale } from '../models/scale.model';
import { Hive } from '../models/hive.model';
import { ScaleData } from '../models/scale_data.model';
import { limitScale } from '../utils/premium.util';
import { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';

export default class ScaleController {
  static async get(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as any;
      const query = Scale.query()
        .withGraphFetched('hive')
        .where('user_id', req.user.user_id);
      if (params.id) {
        query.findById(params.id);
      }
      reply.send(params.id ? [await query] : await query); // array is returned to be consistent with batchGet function
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }
  static async patch(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const ids = body.ids;
      const insert = { ...body.data };

      const result = await Scale.transaction(async (trx) => {
        if (insert.hive_id)
          await Hive.query(trx)
            .where({ id: insert.hive_id, user_id: req.user.user_id })
            .throwIfNotFound();

        return await Scale.query(trx)
          .patch(insert)
          .findByIds(ids)
          .where('user_id', req.user.user_id);
      });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }
  static async post(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;

      const limit = await limitScale(req.user.user_id);
      if (limit) {
        reply.send(httpErrors.PaymentRequired('no premium access'));
      }

      const result = await Scale.transaction(async (trx) => {
        if (body.hive_id)
          await Hive.query(trx)
            .where({ id: body.hive_id, user_id: req.user.user_id })
            .throwIfNotFound();

        return await Scale.query(trx).insert({
          name: body.name,
          hive_id: body.hive_id,
          user_id: req.user.user_id,
        });
      });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }
  static async delete(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as any;
      const result = await Scale.transaction(async (trx) => {
        await ScaleData.query(trx).delete().joinRelated('scale').where({
          scale_id: params.id,
          'scale.user_id': req.user.user_id,
        });
        return await Scale.query(trx)
          .deleteById(params.id)
          .where('user_id', req.user.user_id);
      });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }
}
