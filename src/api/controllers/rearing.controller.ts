import { checkMySQLError } from '@utils/error.util';
import { Rearing } from '@models/rearing/rearing.model';
import { FastifyReply, FastifyRequest } from 'fastify';

export default class RearingController {
  static async get(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { order, direction, offset, limit, q, filters } = req.query as any;
      const query = Rearing.query()
        .withGraphJoined('[type, start]')
        .where({
          'rearings.user_id': req.user.user_id,
        })
        .page(
          offset ? offset : 0,
          parseInt(limit) === 0 || !limit ? 10 : limit,
        );
      if (order) {
        if (Array.isArray(order)) {
          order.forEach((field, index) =>
            query.orderBy(field, direction[index]),
          );
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
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async patch(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const ids = body.ids;
      const insert = { ...body.data };
      const result = await Rearing.transaction(async (trx) => {
        return await Rearing.query(trx)
          .patch({ ...insert, edit_id: req.user.bee_id })
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
      const result = await Rearing.transaction(async (trx) => {
        return await Rearing.query(trx).insertAndFetch({
          ...body,
          user_id: req.user.user_id,
          bee_id: req.user.bee_id,
        });
      });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async updateDate(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const result = await Rearing.transaction(async (trx) => {
        return Rearing.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            date: body.start,
          })
          .findByIds(body.ids)
          .where('rearings.user_id', req.user.user_id);
      });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async batchDelete(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const result = await Rearing.transaction(async (trx) => {
        return Rearing.query(trx)
          .delete()
          .findByIds(body.ids)
          .where('user_id', req.user.user_id);
      });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async batchGet(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const result = await Rearing.transaction(async (trx) => {
        const res = await Rearing.query(trx)
          .findByIds(body.ids)
          .where('rearings.user_id', req.user.user_id);
        return res;
      });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }
}
