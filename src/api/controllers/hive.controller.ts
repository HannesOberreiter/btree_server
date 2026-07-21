import type { FastifyReply, FastifyRequest } from 'fastify';

import { KyselyServer } from '../../servers/kysely.server.js';
import { Apiary } from '../models/apiary.model.js';
import { Checkup } from '../models/checkup.model.js';
import { Feed } from '../models/feed.model.js';
import { Harvest } from '../models/harvest.model.js';
import { Hive } from '../models/hive.model.js';
import { HiveLocation } from '../models/hive_location.model.js';
import { Movedate } from '../models/movedate.model.js';
import { Treatment } from '../models/treatment.model.js';
import { listTodos } from '../modules/todo.module.js';
import type { HiveIdParams, HiveTaskQuery } from '../schemas/hive.schema.js';

export default class HiveController {
  static async getTasks(req: FastifyRequest, _reply: FastifyReply) {
    const params = req.params as HiveIdParams;
    const q = req.query as HiveTaskQuery;
    const id = params.id;
    const year = q.year ? q.year : new Date().getFullYear();
    const apiary = q.apiary ? q.apiary : false;

    const result = await Hive.transaction(async (trx) => {
      let hives = [];
      if (apiary) {
        await Apiary.query(trx).findById(id).throwIfNotFound().where({
          'apiaries.user_id': req.session.user.user_id,
          'apiaries.deleted': false,
        });
        const query_hives = await HiveLocation.query(trx)
          .select('hive_id')
          .where({
            apiary_id: id,
            hive_deleted: false,
            hive_modus: true,
          });
        hives = query_hives.map((hive) => hive.hive_id);
      } else {
        await Hive.query(trx).findById(id).throwIfNotFound().where({
          'hives.user_id': req.session.user.user_id,
          'hives.deleted': false,
        });
        hives.push(id);
      }

      const harvest = await Harvest.query(trx)
        .select('*', Hive.raw('? as kind', ['harvest']))
        .withGraphFetched(
          '[hive, harvest_apiary, type, creator(identifier), editor(identifier)]',
        )
        .whereIn('hive_id', hives)
        .where({
          deleted: false,
        })
        .whereBetween('date', [`${year}-01-01`, `${year}-12-31`])
        .orderBy('date', 'desc');
      const feed = await Feed.query(trx)
        .select('*', Hive.raw('? as kind', ['feed']))
        .withGraphFetched(
          '[hive, feed_apiary, type, creator(identifier), editor(identifier)]',
        )
        .whereIn('hive_id', hives)
        .where({
          deleted: false,
        })
        .whereBetween('date', [`${year}-01-01`, `${year}-12-31`])
        .orderBy('date', 'desc');
      const treatment = await Treatment.query(trx)
        .select('*', Hive.raw('? as kind', ['treatment']))
        .withGraphFetched(
          '[hive, treatment_apiary, type, disease, vet, creator(identifier), editor(identifier)]',
        )
        .whereIn('hive_id', hives)
        .where({
          deleted: false,
        })
        .whereBetween('date', [`${year}-01-01`, `${year}-12-31`])
        .orderBy('date', 'desc');
      const checkup = await Checkup.query(trx)
        .select('*', Hive.raw('? as kind', ['checkup']))
        .withGraphFetched(
          '[hive, checkup_apiary, type, creator(identifier), editor(identifier)]',
        )
        .whereIn('hive_id', hives)
        .where({
          deleted: false,
        })
        .whereBetween('date', [`${year}-01-01`, `${year}-12-31`])
        .orderBy('date', 'desc');
      const movedate = await Movedate.query(trx)
        .select('*', Hive.raw('? as kind', ['movedate']))
        .withGraphFetched(
          '[hive, apiary, creator(identifier), editor(identifier)]',
        )
        .whereIn('hive_id', hives)
        .whereBetween('date', [`${year}-01-01`, `${year}-12-31`])
        .orderBy('date', 'desc');

      const todo = [];
      if (apiary) {
        const filters = JSON.stringify([
          {
            date: {
              from: `${year}-01-01`,
              to: `${year}-12-31`,
            },
          },
        ]);
        const todosQuery = await listTodos(
          KyselyServer.getInstance().db,
          {
            companyId: req.session.user.user_id,
            beeId: req.session.user.bee_id,
            isLlm: req.session.llm === true,
          },
          { apiary_id: id, filters },
        );
        todo.push(
          ...todosQuery.results.map((todo) =>
            Object.assign(todo, { kind: 'todo' }),
          ),
        );
      }
      return {
        harvest,
        feed,
        treatment,
        checkup,
        movedate,
        todo,
      };
    });
    return { ...result };
  }
}
