import { checkMySQLError } from '@utils/error.util';
import { ChargeType } from '@models/option/charge_type.model';
import { CheckupType } from '@models/option/checkup_type.model';
import { FeedType } from '@models/option/feed_type.model';
import { HarvestType } from '@models/option/harvest_type.model';
import { TreatmentType } from '@models/option/treatment_type.model';
import { TreatmentDisease } from '@models/option/treatment_disease.model';
import { TreatmentVet } from '@models/option/treatment_vet.model';
import { HiveSource } from '../models/option/hive_source.model';
import { HiveType } from '../models/option/hive_type.mode';
import { QueenMating } from '../models/option/queen_mating.model';
import { QueenRace } from '../models/option/queen_race.model';
import { FastifyReply, FastifyRequest } from 'fastify';
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
  };

  static async get(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as any;
      const { order, direction, modus } = req.query as any;
      const table = Object(OptionController.tables)[params.table];
      const query = table
        .query()
        .where(`${params.table}.user_id`, req.user.user_id);
      if (params.table === 'charge_types') {
        query.withGraphJoined('stock');
      }
      if (modus) {
        query.where('modus', modus === 'true');
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

      const result = await query;
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async patch(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const params = req.params as any;
      const ids = body.ids;
      const insert = { ...body.data };
      const table = Object(OptionController.tables)[params.table];
      const result = await table.transaction(async (trx) => {
        return await table
          .query(trx)
          .patch({ ...insert })
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
      const params = req.params as any;
      const body = req.body as any;
      const insert = { ...body };
      const table = Object(OptionController.tables)[params.table];
      const result = await table.transaction(async (trx) => {
        if (insert.favorite == true) {
          await table
            .query(trx)
            .patch({ favorite: false })
            .where('user_id', req.user.user_id);
        }
        return await table.query(trx).insert({
          ...insert,
          user_id: req.user.user_id,
        });
      });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async updateStatus(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as any;
      const body = req.body as any;
      const table = Object(OptionController.tables)[params.table];
      const result = await table.transaction(async (trx) => {
        return table
          .query(trx)
          .patch({
            modus: body.status,
          })
          .findByIds(body.ids)
          .where('user_id', req.user.user_id);
      });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async updateFavorite(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as any;
      const body = req.body as any;
      const table = Object(OptionController.tables)[params.table];
      const result = await table.transaction(async (trx) => {
        await table
          .query(trx)
          .patch({ favorite: false })
          .where('user_id', req.user.user_id);

        return table
          .query(trx)
          .patch({ favorite: true })
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
      const params = req.params as any;
      const body = req.body as any;
      const table = Object(OptionController.tables)[params.table];
      const result = await table.transaction(async (trx) => {
        const res = await table
          .query(trx)
          .findByIds(body.ids)
          .where('user_id', req.user.user_id);
        return res;
      });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async batchDelete(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as any;
      const body = req.body as any;
      const table = Object(OptionController.tables)[params.table];
      const result = await table.transaction(async (trx) => {
        return await table
          .query(trx)
          .delete()
          .findByIds(body.ids)
          .where('user_id', req.user.user_id);
      });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }
}
