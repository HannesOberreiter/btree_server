import type { FastifyReply, FastifyRequest } from 'fastify';
import type Objection from 'objection';
import dayjs from 'dayjs';
import { map } from 'lodash-es';
import { Checkup } from '../models/checkup.model.js';
import { Harvest } from '../models/harvest.model.js';
import { Queen } from '../models/queen.model.js';
import { QueenDuration } from '../models/queen_duration.model.js';

export default class QueenController {
  static async get(req: FastifyRequest, _reply: FastifyReply) {
    const {
      order,
      direction,
      offset,
      limit,
      modus,
      deleted,
      q,
      details,
      filters,
      latest,
    } = req.query as any;
    const query = Queen.query()
      .where({
        'queens.user_id': req.session.user.user_id,
        'queens.deleted': deleted === true,
      })
      .page(offset || 0, limit === 0 || !limit ? 10 : limit);

    if (modus !== undefined && modus !== null) {
      query.where('queens.modus', modus === true);
    }

    if (details === true) {
      query.withGraphJoined(
        '[hive_location,queen_location,race,mating,own_mother,creator(identifier),editor(identifier)]',
      );
      if (latest === true) {
        query.whereNotNull('queen_location.queen_id');
      }
      else if (latest === false) {
        query.whereNull('queen_location.queen_id');
      }
    }
    else {
      query.withGraphJoined('hive_location');
    }

    if (order) {
      if (Array.isArray(order)) {
        order.forEach((field, index) => query.orderBy(field, direction[index]));
      }
      else {
        query.orderBy(order, direction);
      }
    }

    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          filtering.forEach((v) => {
            if ('queens.date' in v && typeof v['queens.date'] === 'object') {
              query.whereBetween('queens.date', [
                v['queens.date'].from,
                v['queens.date'].to,
              ]);
            }
            else {
              if (v['queens.hive_id'] === 'empty') {
                query.whereNull('hive_location.hive_id');
              }
              else {
                query.where(v);
              }
            }
          });
        }
      }
      catch (e) {
        req.log.error(e);
      }
    }
    if (q) {
      const search = `${q}`; // Querystring could be converted be a number

      if (search.trim() !== '') {
        query.where((builder) => {
          builder.orWhere('queens.name', 'like', `%${search}%`);
          builder.orWhere('hive_location.hive_name', 'like', `%${search}%`);
        });
      }
    }

    const result = await query.orderBy('id');
    return { ...result };
  }

  static async getPedigree(req: FastifyRequest, _reply: FastifyReply) {
    const params = req.params as any;
    const queen = await Queen.query()
      .withRecursive('mothers', (qb) => {
        qb.from('queens')
          .select(
            'queens.name',
            'queens.id',
            'mother_id',
            'date',
            'mark_colour',
            'mother',
            'queen_matings.name as mating',
            'queen_races.name as race',
          )
          .where({
            'queens.user_id': req.session.user.user_id,
            'queens.id': params.id,
          })
          .leftJoin('queen_matings', 'mating_id', 'queen_matings.id')
          .leftJoin('queen_races', 'race_id', 'queen_races.id')

          .unionAll((qb) => {
            qb.select(
              'queens.name',
              'queens.id',
              'queens.mother_id',
              'queens.date',
              'queens.mark_colour',
              'queens.mother',
              'queen_matings.name as mating',
              'queen_races.name as race',
            )
              .from('queens')
              .leftJoin('queen_matings', 'queens.mating_id', 'queen_matings.id')
              .leftJoin('queen_races', 'race_id', 'queen_races.id')
              .innerJoin('mothers', 'queens.id', 'mothers.mother_id');
          });
      })
      .select('*')
      .from('mothers');

    return queen;
  }

  static async getStats(req: FastifyRequest, _reply: FastifyReply) {
    const { order, direction, offset, limit, q, filters } = req.query as any;
    const query = QueenDuration.query();
    query
      .withGraphJoined('[queen as queens, hive_location]')
      .where({
        'queen_durations.user_id': req.session.user.user_id,
      })
      .page(offset || 0, limit === 0 || !limit ? 10 : limit);

    if (order) {
      if (Array.isArray(order)) {
        order.forEach((field, index) => query.orderBy(field, direction[index]));
      }
      else {
        query.orderBy(order, direction);
      }
    }

    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          filtering.forEach((v) => {
            if (
              'queens.move_date' in v
              && typeof v['queens.move_date'] === 'object'
            ) {
              query.whereBetween('queens.move_date', [
                v['queens.move_date'].from,
                v['queens.move_date'].to,
              ]);
            }
            else {
              if (v['queens.hive_id'] === 'empty') {
                query.whereNull('hive_location.hive_id');
              }
              else {
                query.where(v);
              }
            }
          });
        }
      }
      catch (e) {
        req.log.error(e);
      }
    }
    if (q) {
      const search = `${q}`; // Querystring could be converted be a number

      if (search.trim() !== '') {
        query.where((builder) => {
          builder.orWhere('queens.name', 'like', `%${search}%`);
          builder.orWhere('hive_location.hive_name', 'like', `%${search}%`);
        });
      }
    }

    const result = await query.orderBy('id') as any;

    for (let index = 0; index < result.results.length; index++) {
      const queen = result.results[index];
      const query_checkup = await Checkup.query()
        .first()
        .select(
          Checkup.raw('AVG(NULLIF(brood, 0)) as brood'),
          Checkup.raw('AVG(NULLIF(pollen, 0)) as pollen'),
          Checkup.raw('AVG(NULLIF(comb, 0)) as comb'),
          Checkup.raw('AVG(NULLIF(temper, 0)) as temper'),
          Checkup.raw('AVG(NULLIF(calm_comb, 0)) as calm_comb'),
          Checkup.raw('AVG(NULLIF(swarm, 0)) as swarm'),
          Checkup.raw('AVG(NULLIF(varroa, 0)) as varroa'),
          Checkup.raw('AVG(NULLIF(strong, 0)) as strong'),
        )
        .where('hive_id', queen.hive_id)
        .whereBetween('date', [queen.move_date, queen.last_date]);

      const query_harvest = await Harvest.query()
        .first()
        .sum('frames as frames')
        .sum('amount as amount')
        .where('hive_id', queen.hive_id)
        .whereBetween('date', [queen.move_date, queen.last_date]);

      queen.checkup = query_checkup;
      queen.harvest = query_harvest;
    }
    return result;
  }

  static async post(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const start = Number.parseInt(body.start);
    const repeat = Number.parseInt(body.repeat) > 1 ? Number.parseInt(body.repeat) : 1;

    const insert = { ...body };
    delete insert.start;
    delete insert.repeat;
    delete insert.name;
    delete insert.hive_id;

    const result = await Queen.transaction(async (trx) => {
      const result = [];
      for (let i = 0; i < repeat; i++) {
        const name = repeat > 1 ? body.name + (start + i) : body.name;
        const hive_id = body.hive_id ? body.hive_id[i] : null;
        const res = await Queen.query(trx).insert({
          ...insert,
          name,
          hive_id,
          user_id: req.session.user.user_id,
          bee_id: req.session.user.bee_id,
        });
        if (hive_id && body.move_date) {
          await inactivateOtherQueens(trx, hive_id, body.move_date);
        }
        result.push(res.id);
      }
      return result;
    });
    return result;
  }

  static async patch(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const ids = body.ids;
    const insert = { ...body.data };
    console.log(insert);
    if (insert.hive_id) {
      insert.hive_id = insert.hive_id !== 'empty' ? insert.hive_id : null;
    }
    const result = await Queen.transaction(async (trx) => {
      const res = await Queen.query(trx)
        .patch({ ...insert, edit_id: req.session.user.bee_id })
        .findByIds(ids)
        .where('user_id', req.session.user.user_id);
      if (insert.hive_id) {
        await inactivateOtherQueens(trx, insert.hive_id, insert.move_date);
      }
      return res;
    });
    return result;
  }

  static async updateStatus(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const result = await Queen.transaction(async (trx) => {
      return Queen.query(trx)
        .patch({
          edit_id: req.session.user.bee_id,
          modus: body.status,
          modus_date: dayjs().format('YYYY-MM-DD'),
        })
        .findByIds(body.ids)
        .where('user_id', req.session.user.user_id);
    });
    return result;
  }

  static async batchDelete(req: FastifyRequest, _reply: FastifyReply) {
    const q = req.query as any;
    const body = req.body as any;
    const hardDelete = !!q.hard;
    const restoreDelete = !!q.restore;

    const result = await Queen.transaction(async (trx) => {
      const res = await Queen.query()
        .select('id', 'deleted')
        .where('user_id', req.session.user.user_id)
        .whereIn('id', body.ids);

      const softIds = [];
      const hardIds = [];
      map(res, (obj) => {
        if ((obj.deleted || hardDelete) && !restoreDelete)
          hardIds.push(obj.id);
        else softIds.push(obj.id);
      });

      if (hardIds.length > 0) {
        await Queen.query(trx).delete().whereIn('id', hardIds);
      }
      if (softIds.length > 0) {
        await Queen.query(trx)
          .patch({
            deleted: !restoreDelete,
            deleted_at: dayjs()
              .utc()
              .toISOString()
              .slice(0, 19)
              .replace('T', ' '),
            edit_id: req.session.user.bee_id,
          })
          .findByIds(softIds);
      }

      return res;
    });
    return result;
  }

  static async batchGet(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const result = await Queen.query().findByIds(body.ids).where({
      user_id: req.session.user.user_id,
    });
    return result;
  }
}

/**
 * @description If a new queen is added to a hive all other queens in the hive should be inactivated (RIP)
 */
async function inactivateOtherQueens(
  trx: Objection.Transaction,
  hive_id: number,
  move_date: string,
) {
  let lastMoveDate = new Date(move_date);
  const queens = await Queen.query(trx)
    .where('hive_id', hive_id)
    .orderBy('move_date', 'desc');

  for (const queen of queens) {
    if (!queen.move_date)
      continue;
    const curMoveDate = new Date(queen.move_date);
    if (queen.modus && curMoveDate < lastMoveDate) {
      await Queen.query(trx)
        .patch({
          modus: false,
          modus_date: lastMoveDate.toISOString().split('T')[0],
        })
        .where('id', queen.id);
    }
    if (curMoveDate < lastMoveDate) {
      lastMoveDate = curMoveDate;
    }
  }
}
