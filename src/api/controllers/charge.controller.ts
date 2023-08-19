import dayjs from 'dayjs';
import { map } from 'lodash-es';
import { FastifyReply, FastifyRequest } from 'fastify';

import { Charge } from '../models/charge.model.js';
import { ChargeStock } from '../models/charge_stock.model.js';

export default class ChargeController {
  static async get(req: FastifyRequest, reply: FastifyReply) {
    const { order, direction, offset, limit, q, filters, deleted } =
      req.query as any;
    const query = Charge.query()
      .withGraphJoined('[type.stock, creator(identifier), editor(identifier)]')
      .where({
        'charges.user_id': req.session.user.user_id,
        'charges.deleted': deleted === 'true',
      })
      .page(offset ? offset : 0, parseInt(limit) === 0 || !limit ? 10 : limit);

    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          filtering.forEach((v) => {
            if ('bestbefore' in v && typeof v['bestbefore'] === 'object') {
              query.whereBetween('bestbefore', [
                v.bestbefore.from,
                v.bestbefore.to,
              ]);
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
            .orWhere('type.name', 'like', `%${q}%`)
            .orWhere('charges.name', 'like', `%${q}%`)
            .orWhere('charges.charge', 'like', `%${q}%`);
        });
      }
    }
    const result = await query.orderBy('id');
    return { ...result };
  }

  static async getStock(req: FastifyRequest, reply: FastifyReply) {
    const { order, direction, offset, limit, q } = req.query as any;
    const query = ChargeStock.query()
      .select('type.id', 'sum', 'type.name', 'type.unit', 'sum_in', 'sum_out')
      .leftJoinRelated('type')
      .where({
        'charge_stocks.user_id': req.session.user.user_id,
        'type.modus': true,
      })
      .page(offset ? offset : 0, parseInt(limit) === 0 || !limit ? 10 : limit);

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
          builder.orWhere('type.name', 'like', `%${q}%`);
        });
      }
    }
    const result = await query.orderBy('type_id');
    return { ...result };
  }

  static async post(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const insert = {
      date: body.date,
      bestbefore: body.bestbefore,
      name: body.name,
      charge: body.charge,
      price: body.price,
      amount: body.amount,
      url: body.url,
      kind: body.kind,
      type_id: body.type_id,
      note: body.note,
    };
    const result = await Charge.transaction(async (trx) => {
      const result = [];

      const res = await Charge.query(trx).insert({
        ...insert,
        user_id: req.session.user.user_id,
        bee_id: req.session.user.bee_id,
      });
      result.push(res.id);
      return result;
    });
    return result;
  }

  static async patch(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const ids = body.ids;
    const insert = { ...body.data };
    const result = await Charge.transaction(async (trx) => {
      return await Charge.query(trx)
        .patch({ ...insert, edit_id: req.session.user.bee_id })
        .findByIds(ids)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }

  static async batchGet(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const result = await Charge.transaction(async (trx) => {
      const res = await Charge.query(trx)
        .findByIds(body.ids)
        .where('user_id', req.session.user.user_id);
      return res;
    });
    return result;
  }

  static async batchDelete(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as any;
    const body = req.body as any;
    const hardDelete = query.hard ? true : false;
    const restoreDelete = query.restore ? true : false;

    const result = await Charge.transaction(async (trx) => {
      const res = await Charge.query()
        .where('user_id', req.session.user.user_id)
        .whereIn('id', body.ids);

      const softIds = [];
      const hardIds = [];
      map(res, (obj) => {
        if ((obj.deleted || hardDelete) && !restoreDelete) hardIds.push(obj.id);
        else softIds.push(obj.id);
      });

      if (hardIds.length > 0) {
        await Charge.query(trx).delete().whereIn('id', hardIds);
      }

      if (softIds.length > 0)
        await Charge.query(trx)
          .patch({
            deleted: restoreDelete ? false : true,
            deleted_at: dayjs()
              .utc()
              .toISOString()
              .slice(0, 19)
              .replace('T', ' '),
            edit_id: req.session.user.bee_id,
          })
          .findByIds(softIds);

      return res;
    });
    return result;
  }
}
