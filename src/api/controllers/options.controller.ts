import type { FastifyReply, FastifyRequest } from 'fastify';

import { ChargeType } from '../models/option/charge_type.model.js';
import { CheckupType } from '../models/option/checkup_type.model.js';
import { FeedType } from '../models/option/feed_type.model.js';
import { HarvestType } from '../models/option/harvest_type.model.js';
import { HiveSource } from '../models/option/hive_source.model.js';
import { HiveType } from '../models/option/hive_type.mode.js';
import { QueenMating } from '../models/option/queen_mating.model.js';
import { QueenRace } from '../models/option/queen_race.model.js';
import { TreatmentDisease } from '../models/option/treatment_disease.model.js';
import { TreatmentType } from '../models/option/treatment_type.model.js';
import { TreatmentVet } from '../models/option/treatment_vet.model.js';
import type { CompatibilityQuery } from '../schemas/common.schema.js';
import type { OptionTableParams } from '../schemas/option.schema.js';
import type {
  PatchBody,
  PostBody,
  UpdateStatusBody,
  UpdateFavoriteBody,
  BatchDeleteBody,
  BatchGetBody,
} from '../schemas/option.schema.js';

export default class OptionController {
  private static tables = {
    charge_types: ChargeType,
    hive_sources: HiveSource,
    hive_types: HiveType,
    feed_types: FeedType,
    harvest_types: HarvestType,
    checkup_types: CheckupType,
    queen_matings: QueenMating,
    queen_races: QueenRace,
    treatment_diseases: TreatmentDisease,
    treatment_types: TreatmentType,
    treatment_vets: TreatmentVet,
  } as const;

  static tableNames = Object.keys(OptionController.tables);

  static async get(req: FastifyRequest, _reply: FastifyReply) {
    const params = (req.params as OptionTableParams).table;
    const { order, direction, modus } = req.query as CompatibilityQuery;
    const table = OptionController.tables[params];
    const query = table
      .query()
      .where(`${params}.user_id`, req.session.user.user_id);
    if (params === 'charge_types') {
      query.withGraphJoined('stock');
    }
    if (modus !== undefined && modus !== null) {
      query.where('modus', modus);
    }
    if (order) {
      if (Array.isArray(order)) {
        order.forEach((field, index) =>
          query.orderBy(
            field,
            (Array.isArray(direction) ? direction[index] : direction) ?? 'asc',
          ),
        );
      } else {
        query.orderBy(
          order,
          (Array.isArray(direction) ? direction[0] : direction) ?? 'asc',
        );
      }
    }
    const result = await query;
    return result;
  }

  static async patch(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as PatchBody;
    const params = (req.params as OptionTableParams).table;
    const ids = body.ids;
    const insert = { ...body.data };
    const table = OptionController.tables[params];
    const result = await table.transaction(async (trx) => {
      return await table
        .query(trx)
        .patch({ ...insert })
        .findByIds(ids)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }

  static async post(req: FastifyRequest, _reply: FastifyReply) {
    const params = (req.params as OptionTableParams).table;
    const body = req.body as PostBody;
    const insert = { ...body };
    const table = OptionController.tables[params];
    const result = await table.transaction(async (trx) => {
      if (insert.favorite === true) {
        await table
          .query(trx)
          .patch({ favorite: false })
          .where('user_id', req.session.user.user_id);
      }
      return await table.query(trx).insert({
        ...insert,
        user_id: req.session.user.user_id,
      });
    });
    return result;
  }

  static async updateStatus(req: FastifyRequest, _reply: FastifyReply) {
    const params = (req.params as OptionTableParams).table;
    const body = req.body as UpdateStatusBody;
    const table = OptionController.tables[params];
    const result = await table.transaction(async (trx) => {
      return await table
        .query(trx)
        .patch({
          modus: body.status,
        })
        .findByIds(body.ids)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }

  static async updateFavorite(req: FastifyRequest, _reply: FastifyReply) {
    const params = (req.params as OptionTableParams).table;
    const body = req.body as UpdateFavoriteBody;
    const table = OptionController.tables[params];
    const result = await table.transaction(async (trx) => {
      await table
        .query(trx)
        .patch({ favorite: false })
        .where('user_id', req.session.user.user_id);

      return await table
        .query(trx)
        .patch({ favorite: true })
        .findByIds(body.ids)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }

  static async batchGet(req: FastifyRequest, _reply: FastifyReply) {
    const params = (req.params as OptionTableParams).table;
    const body = req.body as BatchGetBody;
    const table = OptionController.tables[params];
    const result = await table.transaction(async (trx) => {
      const res = await table
        .query(trx)
        .findByIds(body.ids)
        .where('user_id', req.session.user.user_id);
      return res;
    });
    return result;
  }

  static async batchDelete(req: FastifyRequest, _reply: FastifyReply) {
    const params = (req.params as OptionTableParams).table;
    const body = req.body as BatchDeleteBody;
    const table = OptionController.tables[params];
    const result = await table.transaction(async (trx) => {
      return await table
        .query(trx)
        .delete()
        .findByIds(body.ids)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }
}
