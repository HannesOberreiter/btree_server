import { checkMySQLError } from '@utils/error.util';
import { Checkup } from '@models/checkup.model';
import { map } from 'lodash';
import { Hive } from '../models/hive.model';
import dayjs from 'dayjs';
import { FastifyReply, FastifyRequest } from 'fastify';
export default class CheckupController {
  static async get(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { order, direction, offset, limit, q, filters, deleted, done } =
        req.query as any;
      const query = Checkup.query()
        .withGraphJoined(
          '[checkup_apiary, type, hive, creator(identifier), editor(identifier)]',
        )
        .where({
          'hive.deleted': false,
          'checkups.user_id': req.user.user_id,
          'checkups.deleted': deleted === 'true',
        })
        .page(
          offset ? offset : 0,
          parseInt(limit) === 0 || !limit ? 10 : limit,
        );

      if (done) {
        query.where('checkups.done', done === 'true');
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
          order.forEach((field, index) =>
            query.orderBy(field, direction[index]),
          );
        } else {
          query.orderBy(order, direction);
        }
      }
      if (q) {
        if (q.trim() !== '') {
          query.where((builder) => {
            builder.orWhere('hive.name', 'like', `%${q}%`);
          });
        }
      }
      const result = await query.orderBy(['hive_id', 'id']);
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
      const result = await Checkup.transaction(async (trx) => {
        return await Checkup.query(trx)
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
      const hive_ids = body.hive_ids;
      const interval = body.interval;
      const repeat = body.repeat;

      const insert = body;
      delete insert.hive_ids;
      delete insert.interval;
      delete insert.repeat;

      const result = await Checkup.transaction(async (trx) => {
        const hives = await Hive.query(trx)
          .distinct('hives.id')
          .findByIds(hive_ids)
          .leftJoinRelated('apiaries')
          .where('apiaries.user_id', req.user.user_id);

        const result = [];
        for (const hive in hives) {
          const res = await Checkup.query(trx).insert({
            ...insert,
            hive_id: hives[hive].id,
            bee_id: req.user.bee_id,
            user_id: req.user.user_id,
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
              const res = await Checkup.query(trx).insert({
                ...insert_repeat,
                hive_id: hives[hive].id,
                bee_id: req.user.bee_id,
                user_id: req.user.user_id,
              });
              result.push(res.id);
            }
          }
        }
        return result;
      });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async updateStatus(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const result = await Checkup.transaction(async (trx) => {
        return Checkup.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            done: body.status,
          })
          .findByIds(body.ids)
          .where('user_id', req.user.user_id);
      });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async updateDate(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const result = await Checkup.transaction(async (trx) => {
        return Checkup.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            date: body.start,
            enddate: body.end,
          })
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
      const result = await Checkup.transaction(async (trx) => {
        const res = await Checkup.query(trx)
          .findByIds(body.ids)
          .withGraphJoined('[type, hive]')
          .where('checkups.user_id', req.user.user_id);
        return res;
      });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async batchDelete(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as any;
    const body = req.body as any;
    const hardDelete = query.hard ? true : false;
    const restoreDelete = query.restore ? true : false;

    try {
      const result = await Checkup.transaction(async (trx) => {
        const res = await Checkup.query(trx)
          .findByIds(body.ids)
          .select('id', 'deleted')
          .where('user_id', req.user.user_id);

        const softIds = [];
        const hardIds = [];
        map(res, (obj) => {
          if ((obj.deleted || hardDelete) && !restoreDelete)
            hardIds.push(obj.id);
          else softIds.push(obj.id);
        });

        if (hardIds.length > 0)
          await Checkup.query(trx).delete().whereIn('id', hardIds);
        if (softIds.length > 0)
          await Checkup.query(trx)
            .patch({
              deleted: restoreDelete ? false : true,
              edit_id: req.user.bee_id,
            })
            .findByIds(softIds);

        return res;
      });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }
}
