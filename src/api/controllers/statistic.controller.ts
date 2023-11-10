import { hiveCountApiary, hiveCountTotal } from '../utils/statistic.util.js';
import { Harvest } from '../models/harvest.model.js';
import { Feed } from '../models/feed.model.js';
import { Treatment } from '../models/treatment.model.js';
import { Checkup } from '../models/checkup.model.js';
import { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';

export default class StatisticController {
  static async getHiveCountTotal(req: FastifyRequest, reply: FastifyReply) {
    const result = await hiveCountTotal(req.session.user.user_id);
    return result;
  }
  static async getHiveCountApiary(req: FastifyRequest, reply: FastifyReply) {
    let date = new Date();
    const query = req.query as any;
    try {
      date = new Date(query.date as string);
    } catch (e) {
      throw new Error('Invalid date');
    }
    const result = await hiveCountApiary(date, req.session.user.user_id);
    return result;
  }

  static async getHarvestHive(req: FastifyRequest, reply: FastifyReply) {
    const { order, direction, offset, limit, q, filters, groupByType } =
      req.query as any;

    const query = Harvest.query()
      .select(Harvest.raw('YEAR(date) as year'), 'hive_id')
      .sum('amount as amount_sum')
      .sum('frames as frames_sum')
      .avg('amount as amount_avg')
      .avg('frames as frames_avg')
      .avg('water as water_avg')
      .withGraphJoined('hive')
      .withGraphJoined('harvest_apiary as task_apiary')
      .groupBy('hive_id', 'year')
      .where({
        'hive.deleted': false,
        'harvests.deleted': false,
        'harvests.user_id': req.session.user.user_id,
      })
      .page(offset ? offset : 0, limit === 0 || !limit ? 10 : limit);
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
          builder.orWhere('hive.name', 'like', `%${search}%`);
        });
      }
    }
    if (groupByType) {
      if (groupByType === 'true') {
        query
          .groupBy('harvests.type_id')
          .withGraphJoined('type')
          .select('type.name');
      }
    }
    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          filtering.forEach((v) => {
            if ('year' in v) {
              query.where(Harvest.raw('YEAR(date)'), v.year);
            } else {
              query.where(v);
            }
          });
        }
      } catch (e) {
        req.log.error(e);
      }
    }

    const result = await query.orderBy('hive.name');
    return { ...result };
  }

  static async getHarvestYear(req: FastifyRequest, reply: FastifyReply) {
    const { filters } = req.query as any;
    const query = Harvest.query()
      .select(Harvest.raw('YEAR(date) as year'))
      .select(
        Harvest.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'),
      )
      .select(
        Harvest.raw('SUM(frames) / COUNT(DISTINCT hive_id) as frames_avg'),
      )
      .countDistinct('hive_id as hive_count')
      .sum('amount as amount_sum')
      .sum('frames as frames_sum')
      //.avg('amount as amount_avg')
      //.avg('frames as frames_avg')
      .avg('water as water_avg')
      .withGraphJoined('harvest_apiary as task_apiary')
      .groupBy('year')
      .where({
        'harvests.deleted': false,
        'harvests.user_id': req.session.user.user_id,
      })
      .orderBy('year', 'asc');

    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          filtering.forEach((v) => {
            if ('year' in v) {
              return;
            } else if ('hive_id_array' in v) {
              query.whereIn('hive_id', v['hive_id_array']);
            } else if ('apiary_id_array' in v) {
              query.whereIn('apiary_id', v['apiary_id_array']);
            } else if ('hive_id_array_exclude' in v) {
              query.whereNotIn('hive_id', v['hive_id_array_exclude']);
            } else {
              query.where(v);
            }
          });
        }
      } catch (e) {
        req.log.error(e);
      }
    }
    const result = await query;
    return result;
  }

  static async getHarvestApiary(req: FastifyRequest, reply: FastifyReply) {
    const { filters } = req.query as any;
    const query = Harvest.query()
      .countDistinct('hive_id as hive_count')
      .sum('amount as amount_sum')
      .sum('frames as frames_sum')
      .select(
        Harvest.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'),
      )
      .select(
        Harvest.raw('SUM(frames) / COUNT(DISTINCT hive_id) as frames_avg'),
      )
      //.avg('amount as amount_avg')
      //.avg('frames as frames_avg')
      .avg('water as water_avg')
      .withGraphJoined('harvest_apiary as task_apiary')
      .groupBy('apiary_id')
      .where({
        'harvests.deleted': false,
        'harvests.user_id': req.session.user.user_id,
      })
      .orderBy('task_apiary.apiary_name', 'asc');

    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          filtering.forEach((v) => {
            if ('year' in v) {
              query.where(Harvest.raw('YEAR(date)'), v.year);
            } else if ('hive_id_array' in v) {
              query.whereIn('hive_id', v['hive_id_array']);
            } else if ('apiary_id_array' in v) {
              query.whereIn('apiary_id', v['apiary_id_array']);
            } else if ('hive_id_array_exclude' in v) {
              query.whereNotIn('hive_id', v['hive_id_array_exclude']);
            } else {
              query.where(v);
            }
          });
        }
      } catch (e) {
        req.log.error(e);
      }
    } else {
      query.whereRaw(`YEAR(date) = ${new Date().getFullYear()}`);
    }
    const result = await query;
    return result;
  }

  static async getHarvestType(req: FastifyRequest, reply: FastifyReply) {
    const { filters } = req.query as any;
    const query = Harvest.query()
      .countDistinct('hive_id as hive_count')
      .sum('amount as amount_sum')
      .sum('frames as frames_sum')
      .select(
        Harvest.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'),
      )
      .select(
        Harvest.raw('SUM(frames) / COUNT(DISTINCT hive_id) as frames_avg'),
      )
      //.avg('amount as amount_avg')
      //.avg('frames as frames_avg')
      .avg('water as water_avg')
      .withGraphJoined('harvest_apiary as task_apiary')
      .withGraphJoined('type')
      .groupBy('type_id')
      .where({
        'harvests.deleted': false,
        'harvests.user_id': req.session.user.user_id,
      })
      .orderBy('type.name', 'asc');

    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          filtering.forEach((v) => {
            if ('year' in v) {
              query.where(Harvest.raw('YEAR(date)'), v.year);
            } else if ('hive_id_array' in v) {
              query.whereIn('hive_id', v['hive_id_array']);
            } else if ('apiary_id_array' in v) {
              query.whereIn('apiary_id', v['apiary_id_array']);
            } else if ('hive_id_array_exclude' in v) {
              query.whereNotIn('hive_id', v['hive_id_array_exclude']);
            } else {
              query.where(v);
            }
          });
        }
      } catch (e) {
        req.log.error(e);
      }
    } else {
      query.whereRaw(`YEAR(date) = ${new Date().getFullYear()}`);
    }
    const result = await query;
    return result;
  }

  static async getFeedHive(req: FastifyRequest, reply: FastifyReply) {
    const { order, direction, offset, limit, q, filters, groupByType } =
      req.query as any;

    const query = Feed.query()
      .select(Feed.raw('YEAR(date) as year'), 'hive_id')
      .sum('amount as amount_sum')
      .select(Feed.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'))
      //.avg('amount as amount_avg')
      .withGraphJoined('hive')
      .withGraphJoined('feed_apiary as task_apiary')
      .groupBy('hive_id', 'year')
      .where({
        'hive.deleted': false,
        'feeds.deleted': false,
        'feeds.user_id': req.session.user.user_id,
      })
      .page(offset ? offset : 0, limit === 0 || !limit ? 10 : limit);
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
          builder.orWhere('hive.name', 'like', `%${search}%`);
        });
      }
    }
    if (groupByType) {
      if (groupByType === 'true') {
        query
          .groupBy('feeds.type_id')
          .withGraphJoined('type')
          .select('type.name');
      }
    }
    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          filtering.forEach((v) => {
            if ('year' in v) {
              query.where(Harvest.raw('YEAR(date)'), v.year);
            } else {
              query.where(v);
            }
          });
        }
      } catch (e) {
        req.log.error(e);
      }
    }

    const result = await query.orderBy('hive.name');
    return { ...result };
  }

  static async getFeedYear(req: FastifyRequest, reply: FastifyReply) {
    const { filters } = req.query as any;
    const query = Feed.query()
      .select(Feed.raw('YEAR(date) as year'))
      .countDistinct('hive_id as hive_count')
      .sum('amount as amount_sum')
      .select(Feed.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'))
      //.avg('amount as amount_avg')
      .withGraphJoined('feed_apiary as task_apiary')
      .groupBy('year')
      .where({
        'feeds.deleted': false,
        'feeds.user_id': req.session.user.user_id,
      })
      .orderBy('year', 'asc');

    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          filtering.forEach((v) => {
            if ('year' in v) {
              return;
            } else if ('hive_id_array' in v) {
              query.whereIn('hive_id', v['hive_id_array']);
            } else if ('apiary_id_array' in v) {
              query.whereIn('apiary_id', v['apiary_id_array']);
            } else if ('hive_id_array_exclude' in v) {
              query.whereNotIn('hive_id', v['hive_id_array_exclude']);
            } else {
              query.where(v);
            }
          });
        }
      } catch (e) {
        req.log.error(e);
      }
    }
    const result = await query;
    return result;
  }

  static async getFeedApiary(req: FastifyRequest, reply: FastifyReply) {
    const { filters } = req.query as any;
    const query = Feed.query()
      .countDistinct('hive_id as hive_count')
      .sum('amount as amount_sum')
      .select(Feed.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'))
      //.avg('amount as amount_avg')
      .withGraphJoined('feed_apiary as task_apiary')
      .groupBy('apiary_id')
      .where({
        'feeds.deleted': false,
        'feeds.user_id': req.session.user.user_id,
      })
      .orderBy('task_apiary.apiary_name', 'asc');

    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          filtering.forEach((v) => {
            if ('year' in v) {
              query.where(Harvest.raw('YEAR(date)'), v.year);
            } else if ('hive_id_array' in v) {
              query.whereIn('hive_id', v['hive_id_array']);
            } else if ('apiary_id_array' in v) {
              query.whereIn('apiary_id', v['apiary_id_array']);
            } else if ('hive_id_array_exclude' in v) {
              query.whereNotIn('hive_id', v['hive_id_array_exclude']);
            } else {
              query.where(v);
            }
          });
        }
      } catch (e) {
        req.log.error(e);
      }
    } else {
      query.whereRaw(`YEAR(date) = ${new Date().getFullYear()}`);
    }
    const result = await query;
    return result;
  }

  static async getFeedType(req: FastifyRequest, reply: FastifyReply) {
    const { filters } = req.query as any;
    const query = Feed.query()
      .countDistinct('hive_id as hive_count')
      .sum('amount as amount_sum')
      .select(Feed.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'))
      //.avg('amount as amount_avg')
      .withGraphJoined('feed_apiary as task_apiary')
      .withGraphJoined('type')
      .groupBy('type_id')
      .where({
        'feeds.deleted': false,
        'feeds.user_id': req.session.user.user_id,
      })
      .orderBy('type.name', 'asc');

    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          filtering.forEach((v) => {
            if ('year' in v) {
              query.where(Harvest.raw('YEAR(date)'), v.year);
            } else if ('hive_id_array' in v) {
              query.whereIn('hive_id', v['hive_id_array']);
            } else if ('apiary_id_array' in v) {
              query.whereIn('apiary_id', v['apiary_id_array']);
            } else if ('hive_id_array_exclude' in v) {
              query.whereNotIn('hive_id', v['hive_id_array_exclude']);
            } else {
              query.where(v);
            }
          });
        }
      } catch (e) {
        req.log.error(e);
      }
    } else {
      query.whereRaw(`YEAR(date) = ${new Date().getFullYear()}`);
    }
    const result = await query;
    return result;
  }

  static async getTreatmentHive(req: FastifyRequest, reply: FastifyReply) {
    const { order, direction, offset, limit, q, filters } = req.query as any;

    const query = Treatment.query()
      .select(Treatment.raw('YEAR(date) as year'), 'hive_id')
      .sum('amount as amount_sum')
      .select(
        Treatment.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'),
      )
      //.avg('amount as amount_avg')
      .withGraphJoined('hive')
      .withGraphJoined('treatment_apiary as task_apiary')
      .groupBy('hive_id', 'year')
      .where({
        'hive.deleted': false,
        'treatments.deleted': false,
        'treatments.user_id': req.session.user.user_id,
      })
      .page(offset ? offset : 0, limit === 0 || !limit ? 10 : limit);
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
          builder.orWhere('hive.name', 'like', `%${search}%`);
        });
      }
    }
    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          filtering.forEach((v) => {
            if ('year' in v) {
              query.where(Harvest.raw('YEAR(date)'), v.year);
            } else {
              query.where(v);
            }
          });
        }
      } catch (e) {
        req.log.error(e);
      }
    }

    const result = await query.orderBy('hive.name');
    return { ...result };
  }

  static async getTreatmentYear(req: FastifyRequest, reply: FastifyReply) {
    const { filters } = req.query as any;
    const query = Treatment.query()
      .select(Treatment.raw('YEAR(date) as year'))
      .countDistinct('hive_id as hive_count')
      .sum('amount as amount_sum')
      .select(
        Treatment.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'),
      )
      .withGraphJoined('treatment_apiary as task_apiary')
      .groupBy('year')
      .where({
        'treatments.deleted': false,
        'treatments.user_id': req.session.user.user_id,
      })
      .orderBy('year', 'asc');

    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          filtering.forEach((v) => {
            if ('year' in v) {
              return;
            } else if ('hive_id_array' in v) {
              query.whereIn('hive_id', v['hive_id_array']);
            } else if ('apiary_id_array' in v) {
              query.whereIn('apiary_id', v['apiary_id_array']);
            } else if ('hive_id_array_exclude' in v) {
              query.whereNotIn('hive_id', v['hive_id_array_exclude']);
            } else {
              query.where(v);
            }
          });
        }
      } catch (e) {
        req.log.error(e);
      }
    }
    const result = await query;
    return result;
  }

  static async getTreatmentApiary(req: FastifyRequest, reply: FastifyReply) {
    const { filters } = req.query as any;
    const query = Treatment.query()
      .countDistinct('hive_id as hive_count')
      .sum('amount as amount_sum')
      .select(
        Treatment.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'),
      )
      //.avg('amount as amount_avg')
      .withGraphJoined('treatment_apiary as task_apiary')
      .groupBy('apiary_id')
      .where({
        'treatments.deleted': false,
        'treatments.user_id': req.session.user.user_id,
      })
      .orderBy('task_apiary.apiary_name', 'asc');

    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          filtering.forEach((v) => {
            if ('year' in v) {
              query.where(Harvest.raw('YEAR(date)'), v.year);
            } else if ('hive_id_array' in v) {
              query.whereIn('hive_id', v['hive_id_array']);
            } else if ('apiary_id_array' in v) {
              query.whereIn('apiary_id', v['apiary_id_array']);
            } else if ('hive_id_array_exclude' in v) {
              query.whereNotIn('hive_id', v['hive_id_array_exclude']);
            } else {
              query.where(v);
            }
          });
        }
      } catch (e) {
        req.log.error(e);
      }
    } else {
      query.whereRaw(`YEAR(date) = ${new Date().getFullYear()}`);
    }
    const result = await query;
    return result;
  }

  static async getTreatmentType(req: FastifyRequest, reply: FastifyReply) {
    const { filters } = req.query as any;
    const query = Treatment.query()
      .countDistinct('hive_id as hive_count')
      .sum('amount as amount_sum')
      .select(
        Treatment.raw('SUM(amount) / COUNT(DISTINCT hive_id) as amount_avg'),
      )
      //.avg('amount as amount_avg')
      .withGraphJoined('treatment_apiary as task_apiary')
      .withGraphJoined('type')
      .groupBy('type_id')
      .where({
        'treatments.deleted': false,
        'treatments.user_id': req.session.user.user_id,
      })
      .orderBy('type.name', 'asc');

    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          filtering.forEach((v) => {
            if ('year' in v) {
              query.where(Harvest.raw('YEAR(date)'), v.year);
            } else if ('hive_id_array' in v) {
              query.whereIn('hive_id', v['hive_id_array']);
            } else if ('apiary_id_array' in v) {
              query.whereIn('apiary_id', v['apiary_id_array']);
            } else if ('hive_id_array_exclude' in v) {
              query.whereNotIn('hive_id', v['hive_id_array_exclude']);
            } else {
              query.where(v);
            }
          });
        }
      } catch (e) {
        req.log.error(e);
      }
    } else {
      query.whereRaw(`YEAR(date) = ${new Date().getFullYear()}`);
    }
    const result = await query;
    return result;
  }

  static async getCheckupRatingHive(req: FastifyRequest, reply: FastifyReply) {
    const { order, direction, offset, limit, q, filters } = req.query as any;
    const query = Checkup.query()
      .select(
        'hive_id',
        Checkup.raw('AVG(NULLIF(brood, 0)) as brood'),
        Checkup.raw('AVG(NULLIF(pollen, 0)) as pollen'),
        Checkup.raw('AVG(NULLIF(comb, 0)) as comb'),
        Checkup.raw('AVG(NULLIF(temper, 0)) as temper'),
        Checkup.raw('AVG(NULLIF(calm_comb, 0)) as calm_comb'),
        Checkup.raw('AVG(NULLIF(swarm, 0)) as swarm'),
        Checkup.raw('AVG(NULLIF(varroa, 0)) as varroa'),
        Checkup.raw('AVG(NULLIF(strong, 0)) as strong'),
      )
      .select(Checkup.raw('YEAR(date) as year'))
      .withGraphJoined('hive')
      .where({
        'checkups.deleted': false,
        'checkups.user_id': req.session.user.user_id,
        'hive.deleted': false,
      })
      .groupBy('hive_id', 'year')
      .havingRaw(
        '(SUM(brood) + SUM(pollen) + SUM(comb) + SUM(temper) + SUM(calm_comb) + SUM(swarm) + SUM(varroa) + SUM(strong)) > 0',
      )
      .page(offset ? offset : 0, limit === 0 || !limit ? 10 : limit);

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
          builder.orWhere('hive.name', 'like', `%${search}%`);
        });
      }
    }
    if (filters) {
      try {
        const filtering = JSON.parse(filters);
        if (Array.isArray(filtering)) {
          filtering.forEach((v) => {
            if ('year' in v) {
              query.where(Checkup.raw('YEAR(date)'), v.year);
            } else {
              query.where(v);
            }
          });
        }
      } catch (e) {
        req.log.error(e);
      }
    }

    const result = await query.orderBy('hive.name');
    return { ...result };
  }

  static async getVarroa(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as {
      start_date: string;
      end_date: string;
      hive_ids: string[];
    };

    type ResultStats = {
      hive_name: string;
      varroa: {
        min: number;
        max: number;
        avg: number;
      };
    };

    const resultDatasetCheckup: any = {};
    const resultDatasetTreatment: any = {};
    const resultStats = [] as ResultStats[];

    for (let i = 0; i < query.hive_ids.length; i++) {
      if (i > 20) break;
      const resultCheckup: any[] = [];
      const hive_id = query.hive_ids[i];
      const res = await Checkup.query()
        .select(
          'hive_id',
          'varroa',
          'date',
          'type.name as type_name',
          'hive.name as hive_name',
        )
        .leftJoinRelated('type')
        .leftJoinRelated('hive')
        .where({
          'checkups.deleted': false,
          'checkups.user_id': req.session.user.user_id,
          'hive.deleted': false,
          'checkups.hive_id': hive_id,
        })
        .whereBetween('checkups.date', [query.start_date, query.end_date]);

      if (res.length === 0) continue;

      resultStats[i] = {
        hive_name: (res[0] as any)?.hive_name ?? '',
        varroa: {
          min: 0,
          max: 0,
          avg: 0,
        },
      };

      let averageLength = 0;
      res.map((v: any) => {
        resultCheckup.push([
          hive_id,
          v.varroa,
          v.date.toISOString().split('T')[0],
          v.type_name,
          v.hive_name,
        ]);

        resultStats[i].varroa.max = Math.max(
          resultStats[i].varroa.max,
          v.varroa,
        );
        if (v.varroa > 0) {
          averageLength++;
          resultStats[i].varroa.min = Math.min(
            resultStats[i].varroa.min === 0
              ? v.varroa
              : resultStats[i].varroa.min,
            v.varroa,
          );
          resultStats[i].varroa.avg += v.varroa;
        }
      });
      if (averageLength > 0) {
        resultStats[i].varroa.avg =
          Math.round(
            (resultStats[i].varroa.avg / averageLength + Number.EPSILON) * 100,
          ) / 100;
      }
      resultDatasetCheckup[hive_id] = resultCheckup;
    }

    for (let i = 0; i < query.hive_ids.length; i++) {
      if (i > 20) break;
      const resultTreatment: any[] = [];
      const hive_id = query.hive_ids[i];
      const res = await Treatment.query()
        .select(
          'hive_id',
          'date',
          'amount',
          'type.name as type_name',
          'hive.name as hive_name',
        )
        .leftJoinRelated('type')
        .leftJoinRelated('hive')
        .where({
          'treatments.deleted': false,
          'treatments.user_id': req.session.user.user_id,
          'hive.deleted': false,
          'treatments.hive_id': hive_id,
        })
        .whereBetween('treatments.date', [query.start_date, query.end_date]);

      if (res.length === 0) continue;
      res.map((v: any) => {
        resultTreatment.push([
          hive_id,
          v.amount,
          v.date.toISOString().split('T')[0],
          v.type_name,
          v.hive_name,
          0,
        ]);
      });
      resultDatasetTreatment[hive_id] = resultTreatment;
    }

    return {
      datasetCheckup: resultDatasetCheckup,
      datasetTreatment: resultDatasetTreatment,
      stats: resultStats,
    };
  }
}
