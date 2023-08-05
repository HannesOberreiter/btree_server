import { checkMySQLError } from '@utils/error.util';
import { Apiary } from '../models/apiary.model';
import { map } from 'lodash';
import dayjs from 'dayjs';
import { HiveLocation } from '../models/hive_location.model';
import { Movedate } from '../models/movedate.model';
import { limitApiary } from '../utils/premium.util';
import { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';

async function isDuplicateApiaryName(user_id: number, name: string) {
  const checkDuplicate = await Apiary.query().select('id').findOne({
    user_id,
    name,
    deleted: false,
  });
  if (checkDuplicate?.id) return true;
  return false;
}

export default class ApiaryController {
  static async patch(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const ids = body.ids;
      const insert = { ...body.data };
      const result = await Apiary.transaction(async (trx) => {
        if (body.name) {
          if (ids.length > 1) {
            throw httpErrors.Conflict('name');
          }
        }
        return await Apiary.query(trx)
          .patch({ ...insert, edit_id: req.session.user.bee_id })
          .findByIds(ids)
          .withGraphFetched('hive_count')
          .where('user_id', req.session.user.user_id);
      });
      return result;
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async get(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { order, direction, offset, limit, modus, deleted, q, details } =
        req.query as any;

      const query = Apiary.query()
        .where({
          'apiaries.user_id': req.session.user.user_id,
          'apiaries.deleted': deleted === 'true',
        })
        .page(
          offset ? offset : 0,
          parseInt(limit) === 0 || !limit ? 10 : limit,
        );

      if (modus) {
        query.where('apiaries.modus', modus === 'true');
      }

      if (details === 'true') {
        query.withGraphJoined(
          '[hive_count, creator(identifier),editor(identifier)]',
        );
      } else {
        query.withGraphJoined('[hive_count]');
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
            builder.orWhere('name', 'like', `%${q}%`);
          });
        }
      }
      const result = await query.orderBy('id');
      return { ...result };
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async getDetail(req: FastifyRequest, reply: FastifyReply) {
    try {
      const id = (req.params as any).id;

      const query = Apiary.query()
        .findById(id)
        .where({
          'apiaries.user_id': req.session.user.user_id,
          'apiaries.deleted': false,
        })
        .withGraphFetched(
          '[hive_count, creator(identifier), editor(identifier)]',
        )
        .throwIfNotFound();
      const result = await query;

      const query_others = await Apiary.query()
        .select('id', 'name')
        .where({
          user_id: req.session.user.user_id,
          deleted: false,
          modus: true,
        })
        .orderBy('name');

      const query_first = await Movedate.query()
        .first()
        .where('apiary_id', result.id)
        .orderBy('date', 'desc');

      const query_hives = await HiveLocation.query()
        .select(
          'hive.name as name',
          'hive.id as id',
          'position',
          'hive:queen_location.queen_name',
          'hive:queen_location.queen_modus',
          'hive:queen_location:queen.mark_colour as mark_colour',
        )
        .leftJoinRelated('hive.[queen_location.[queen]]')
        .where({
          apiary_id: result.id,
          hive_deleted: false,
          hive_modus: true,
        })
        .orderBy('hive.position')
        .orderBy('hive.name');

      reply.send({
        ...result,
        firstMovedate: query_first,
        sameLocation: query_others,
        hives: query_hives,
      });
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async post(req: FastifyRequest, reply: FastifyReply) {
    try {
      const limit = await limitApiary(req.session.user.user_id);
      if (limit) {
        throw httpErrors.PaymentRequired('no premium access');
      }

      const result = await Apiary.transaction(async (trx) => {
        if (
          await isDuplicateApiaryName(
            req.session.user.user_id,
            (req.body as any).name,
          )
        ) {
          throw httpErrors.Conflict('name');
        }
        return Apiary.query(trx).insertAndFetch({
          bee_id: req.session.user.bee_id,
          user_id: req.session.user.user_id,
          ...(req.body as any),
        });
      });
      return { ...result };
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async updateStatus(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const result = await Apiary.transaction(async (trx) => {
        return Apiary.query(trx)
          .patch({
            edit_id: req.session.user.bee_id,
            modus: body.status,
          })
          .findByIds(body.ids)
          .where('user_id', req.session.user.user_id);
      });
      return result;
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async batchDelete(req: FastifyRequest, reply: FastifyReply) {
    try {
      const query = req.query as any;
      const body = req.body as any;

      const hardDelete = query.hard ? true : false;
      const restoreDelete = query.restore ? true : false;

      await Apiary.transaction(async (trx) => {
        const res = await Apiary.query()
          .withGraphFetched('hive_count')
          .where('user_id', req.session.user.user_id)
          .whereIn('id', body.ids);

        const softIds = [];
        const hardIds = [];
        map(res, (obj) => {
          if (obj.hive_count) {
            throw httpErrors.Forbidden();
          }

          if ((obj.deleted || hardDelete) && !restoreDelete)
            hardIds.push(obj.id);
          else softIds.push(obj.id);
        });

        if (hardIds.length > 0) {
          await Apiary.query(trx).delete().whereIn('id', hardIds);
        }

        if (softIds.length > 0)
          await Apiary.query(trx)
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
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async batchGet(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const result = await Apiary.query().findByIds(body.ids).where({
        user_id: req.session.user.user_id,
      });
      return { ...result };
    } catch (e) {
      throw checkMySQLError(e);
    }
  }
}
