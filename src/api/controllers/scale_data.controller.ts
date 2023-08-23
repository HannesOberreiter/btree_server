import { ScaleData } from '../models/scale_data.model.js';
import dayjs from 'dayjs';
import { getCompany } from '../utils/api.util.js';
import { isPremium } from '../utils/premium.util.js';
import { Scale } from '../models/scale.model.js';
import { User } from '../models/user.model.js';
import { MailService } from '../../services/mail.service.js';
import { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';

export default class ScaleDataController {
  static async api(req: FastifyRequest, reply: FastifyReply) {
    const q = req.query as any;
    const params = req.params as any;

    const insertDate = q.datetime ? q.datetime : new Date();

    const company = await getCompany(params.api);
    const premium = await isPremium(company.id);
    if (!premium) {
      throw httpErrors.PaymentRequired();
    }

    const result = await ScaleData.transaction(async (trx) => {
      const scale = await Scale.query(trx)
        .select()
        .where({ name: params.ident, user_id: company.id })
        .throwIfNotFound()
        .first();
      const lastInsert = await ScaleData.query(trx)
        .select()
        .where({ scale_id: scale.id })
        .orderBy('datetime', 'DESC')
        .first();

      if (lastInsert) {
        if (q.action === 'CREATE') {
          if (
            dayjs(lastInsert.datetime) >
            dayjs(insertDate as any).subtract(1, 'hour')
          ) {
            throw httpErrors.TooManyRequests();
          }
        }

        if (q.weight && lastInsert.weight && q.action === 'CREATE') {
          try {
            const currentWeight = parseFloat(q.weight as any);
            const checkWeight = Math.abs(lastInsert.weight - currentWeight);
            if (checkWeight > 5) {
              const user = await User.query()
                .leftJoinRelated('company_bee')
                .where({
                  'company_bee.rank': 1,
                  'company_bee.user_id': company.id,
                });
              user.forEach((u) => {
                MailService.getInstance().sendMail({
                  to: u.email,
                  lang: u.lang,
                  subject: 'weight_warning',
                  key: `${scale.name}: ${checkWeight} (${lastInsert.weight} - ${currentWeight})`,
                  name: u.username,
                });
              });
            }
          } catch (e) {
            req.log.error(e);
          }
        }
      }
      const insert = {
        datetime: insertDate,
        weight: q.weight ? q.weight : 0,
        temp1: q.temp1 ? q.temp1 : 0,
        temp2: q.temp2 ? q.temp2 : 0,
        rain: q.rain ? q.rain : 0,
        humidity: q.hum ? q.hum : 0,
        note: q.note ? q.note : '',
        scale_id: scale.id,
      } as any;
      if (q.action === 'CREATE_DEMO') return insert;
      const query = await ScaleData.query(trx).insert({ ...insert });
      return query;
    });
    return { ...result };
  }

  static async get(req: FastifyRequest, reply: FastifyReply) {
    const { order, direction, offset, limit, q, filters } = req.query as any;
    const query = ScaleData.query()
      .withGraphJoined('[scale.hive]')
      .where({
        'scale.user_id': req.session.user.user_id,
      })
      .page(offset ? offset : 0, parseInt(limit) === 0 || !limit ? 10 : limit);

    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          filtering.forEach((v) => {
            if ('date' in v && typeof v['date'] === 'object') {
              query.whereBetween('datetime', [v.date.from, v.date.to]);
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
          builder.orWhere('scale.name', 'like', `%${q}%`);
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
    const result = await ScaleData.transaction(async (trx) => {
      return await ScaleData.query(trx)
        .withGraphJoined('scale')
        .patch({ ...insert })
        .findByIds(ids)
        .where('scale.user_id', req.session.user.user_id);
    });
    return result;
  }

  static async post(req: FastifyRequest, reply: FastifyReply) {
    const insert = req.body as any;
    const result = await ScaleData.transaction(async (trx) => {
      return await ScaleData.query(trx)
        .withGraphJoined('scale')
        .insertGraphAndFetch({
          ...insert,
        })
        .where('scale.user_id', req.session.user.user_id);
    });
    return { ...result };
  }

  static async batchGet(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const result = await ScaleData.transaction(async (trx) => {
      const res = await ScaleData.query(trx)
        .findByIds(body.ids)
        .withGraphJoined('scale')
        .where('scale.user_id', req.session.user.user_id);
      return res;
    });
    return result;
  }

  static async batchDelete(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const result = await ScaleData.transaction(async (trx) => {
      return await ScaleData.query(trx)
        .delete()
        .withGraphJoined('scale')
        .where('scale.user_id', req.session.user.user_id)
        .findByIds(body.ids);
    });
    return result;
  }
}
