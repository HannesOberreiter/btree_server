import { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';
import { map } from 'lodash-es';
import dayjs from 'dayjs';

import { Apiary } from '../models/apiary.model.js';
import { HiveLocation } from '../models/hive_location.model.js';
import { Movedate } from '../models/movedate.model.js';
import { limitApiary } from '../utils/premium.util.js';
import Objection from 'objection';

async function isDuplicateApiaryName(
  user_id: number,
  name: string,
  id?: number,
  trx: Objection.Transaction = null,
) {
  const checkDuplicate = Apiary.query(trx).select('id').findOne({
    user_id,
    name,
    deleted: false,
    modus: true,
  });
  if (id) {
    checkDuplicate.whereNot('id', id);
  }
  const result = await checkDuplicate;
  if (result?.id) return true;
  return false;
}

export default class ApiaryController {
  static async patch(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const ids = body.ids;
    const insert = { ...body.data };
    const result = await Apiary.transaction(async (trx) => {
      if (body.name) {
        if (ids.length > 1) {
          throw httpErrors.Conflict('name');
        }
        if (
          await isDuplicateApiaryName(
            req.session.user.user_id,
            body.name,
            ids[0],
            trx,
          )
        ) {
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
  }

  static async get(req: FastifyRequest, reply: FastifyReply) {
    const { order, direction, offset, limit, modus, deleted, q, details } =
      req.query as any;

    const query = Apiary.query()
      .where({
        'apiaries.user_id': req.session.user.user_id,
        'apiaries.deleted': deleted === true,
      })
      .page(offset ? offset : 0, limit === 0 || !limit ? 10 : limit);

    if (modus !== undefined && modus !== null) {
      query.where('apiaries.modus', modus === true);
    }

    if (details === true) {
      query.withGraphJoined(
        '[hive_count, creator(identifier),editor(identifier)]',
      );
    } else {
      query.withGraphJoined('[hive_count]');
    }
    if (order) {
      if (Array.isArray(order)) {
        order.forEach((field, index) => query.orderBy(field, direction[index]));
      } else {
        query.orderBy(order, direction);
      }
    }

    if (q) {
      const search = '' + q; // Querystring could be converted be a number
      if (search.trim() !== '') {
        query.where((builder) => {
          builder.orWhere('name', 'like', `%${search}%`);
        });
      }
    }
    const result = await query.orderBy('id');
    return result;
  }

  static async getDetail(req: FastifyRequest, reply: FastifyReply) {
    const id = (req.params as any).id;

    const query = Apiary.query()
      .findById(id)
      .where({
        'apiaries.user_id': req.session.user.user_id,
        'apiaries.deleted': false,
      })
      .withGraphFetched('[hive_count, creator(identifier), editor(identifier)]')
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

    return {
      ...result,
      firstMovedate: query_first,
      sameLocation: query_others,
      hives: query_hives,
    };
  }

  static async post(req: FastifyRequest, reply: FastifyReply) {
    const limit = await limitApiary(req.session.user.user_id);
    if (limit) {
      throw httpErrors.PaymentRequired('no premium access');
    }
    const name = (req.body as any).name;

    const result = await Apiary.transaction(async (trx) => {
      if (name) {
        if (
          await isDuplicateApiaryName(
            req.session.user.user_id,
            (req.body as any).name,
            null,
            trx,
          )
        ) {
          throw httpErrors.Conflict('name');
        }
      }
      return Apiary.query(trx).insertAndFetch({
        bee_id: req.session.user.bee_id,
        user_id: req.session.user.user_id,
        ...(req.body as any),
      });
    });
    return { ...result };
  }

  static async updateStatus(req: FastifyRequest, reply: FastifyReply) {
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
  }

  static async batchDelete(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as any;
    const body = req.body as any;

    const hardDelete = query.hard ? true : false;
    const restoreDelete = query.restore ? true : false;

    const result = await Apiary.transaction(async (trx) => {
      const res = await Apiary.query(trx)
        .withGraphFetched('hive_count')
        .where('user_id', req.session.user.user_id)
        .whereIn('id', body.ids);

      const softIds = [];
      const hardIds = [];
      map(res, (obj) => {
        if (obj.hive_count) {
          throw httpErrors.Forbidden();
        }

        if ((obj.deleted || hardDelete) && !restoreDelete) hardIds.push(obj.id);
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
    return result;
  }

  static async batchGet(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const result = await Apiary.query().findByIds(body.ids).where({
      user_id: req.session.user.user_id,
    });
    return result;
  }
}
