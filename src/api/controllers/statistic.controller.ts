import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { hiveCountApiary, hiveCountTotal } from '../utils/statistic.util';
import { Harvest } from '../models/harvest.model';
import { Feed } from '../models/feed.model';
import { Treatment } from '../models/treatment.model';

export class StatisticController extends Controller {
  constructor() {
    super();
  }

  async getHiveCountTotal(
    req: IUserRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await hiveCountTotal(req.user.user_id);
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
  async getHiveCountApiary(
    req: IUserRequest,
    res: Response,
    next: NextFunction
  ) {
    let date = new Date();
    try {
      date = new Date(req.query.date as string);
    } catch (e) {
      console.error(e);
    }
    try {
      const result = await hiveCountApiary(date, req.user.user_id);
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async getHarvestHive(req: IUserRequest, res: Response, next: NextFunction) {
    try {
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
          'harvests.user_id': req.user.user_id,
        })
        .page(
          offset ? offset : 0,
          parseInt(limit) === 0 || !limit ? 10 : limit
        );
      if (order) {
        if (Array.isArray(order)) {
          order.forEach((field, index) =>
            query.orderBy(field, direction[index])
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
          console.log(e);
        }
      }

      const result = await query.orderBy('hive.name');
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async getHarvestYear(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { filters } = req.query as any;
      const query = Harvest.query()
        .select(Harvest.raw('YEAR(date) as year'))
        .countDistinct('hive_id as hive_count')
        .sum('amount as amount_sum')
        .sum('frames as frames_sum')
        .avg('amount as amount_avg')
        .avg('frames as frames_avg')
        .avg('water as water_avg')
        .withGraphJoined('harvest_apiary as task_apiary')
        .groupBy('year')
        .where({
          'harvests.deleted': false,
          'harvests.user_id': req.user.user_id,
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
          console.error(e);
        }
      }
      const result = await query;
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async getHarvestApiary(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { filters } = req.query as any;
      const query = Harvest.query()
        .countDistinct('hive_id as hive_count')
        .sum('amount as amount_sum')
        .sum('frames as frames_sum')
        .avg('amount as amount_avg')
        .avg('frames as frames_avg')
        .avg('water as water_avg')
        .withGraphJoined('harvest_apiary as task_apiary')
        .groupBy('apiary_id')
        .where({
          'harvests.deleted': false,
          'harvests.user_id': req.user.user_id,
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
          console.error(e);
        }
      } else {
        query.whereRaw(`YEAR(date) = ${new Date().getFullYear()}`);
      }
      const result = await query;
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async getHarvestType(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { filters } = req.query as any;
      const query = Harvest.query()
        .countDistinct('hive_id as hive_count')
        .sum('amount as amount_sum')
        .sum('frames as frames_sum')
        .avg('amount as amount_avg')
        .avg('frames as frames_avg')
        .avg('water as water_avg')
        .withGraphJoined('harvest_apiary as task_apiary')
        .withGraphJoined('type')
        .groupBy('type_id')
        .where({
          'harvests.deleted': false,
          'harvests.user_id': req.user.user_id,
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
          console.error(e);
        }
      } else {
        query.whereRaw(`YEAR(date) = ${new Date().getFullYear()}`);
      }
      const result = await query;
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async getFeedHive(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, offset, limit, q, filters, groupByType } =
        req.query as any;

      const query = Feed.query()
        .select(Feed.raw('YEAR(date) as year'), 'hive_id')
        .sum('amount as amount_sum')
        .avg('amount as amount_avg')
        .withGraphJoined('hive')
        .withGraphJoined('feed_apiary as task_apiary')
        .groupBy('hive_id', 'year')
        .where({
          'hive.deleted': false,
          'feeds.deleted': false,
          'feeds.user_id': req.user.user_id,
        })
        .page(
          offset ? offset : 0,
          parseInt(limit) === 0 || !limit ? 10 : limit
        );
      if (order) {
        if (Array.isArray(order)) {
          order.forEach((field, index) =>
            query.orderBy(field, direction[index])
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
          console.log(e);
        }
      }

      const result = await query.orderBy('hive.name');
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async getFeedYear(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { filters } = req.query as any;
      const query = Feed.query()
        .select(Feed.raw('YEAR(date) as year'))
        .countDistinct('hive_id as hive_count')
        .sum('amount as amount_sum')
        .avg('amount as amount_avg')
        .withGraphJoined('feed_apiary as task_apiary')
        .groupBy('year')
        .where({
          'feeds.deleted': false,
          'feeds.user_id': req.user.user_id,
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
          console.error(e);
        }
      }
      const result = await query;
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async getFeedApiary(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { filters } = req.query as any;
      const query = Feed.query()
        .countDistinct('hive_id as hive_count')
        .sum('amount as amount_sum')
        .avg('amount as amount_avg')
        .withGraphJoined('feed_apiary as task_apiary')
        .groupBy('apiary_id')
        .where({
          'feeds.deleted': false,
          'feeds.user_id': req.user.user_id,
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
          console.error(e);
        }
      } else {
        query.whereRaw(`YEAR(date) = ${new Date().getFullYear()}`);
      }
      const result = await query;
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async getFeedType(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { filters } = req.query as any;
      const query = Feed.query()
        .countDistinct('hive_id as hive_count')
        .sum('amount as amount_sum')
        .avg('amount as amount_avg')
        .withGraphJoined('feed_apiary as task_apiary')
        .withGraphJoined('type')
        .groupBy('type_id')
        .where({
          'feeds.deleted': false,
          'feeds.user_id': req.user.user_id,
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
          console.error(e);
        }
      } else {
        query.whereRaw(`YEAR(date) = ${new Date().getFullYear()}`);
      }
      const result = await query;
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async getTreatmentHive(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, offset, limit, q, filters } = req.query as any;

      const query = Treatment.query()
        .select(Treatment.raw('YEAR(date) as year'), 'hive_id')
        .sum('amount as amount_sum')
        .avg('amount as amount_avg')
        .withGraphJoined('hive')
        .withGraphJoined('treatment_apiary as task_apiary')
        .groupBy('hive_id', 'year')
        .where({
          'hive.deleted': false,
          'treatments.deleted': false,
          'treatments.user_id': req.user.user_id,
        })
        .page(
          offset ? offset : 0,
          parseInt(limit) === 0 || !limit ? 10 : limit
        );
      if (order) {
        if (Array.isArray(order)) {
          order.forEach((field, index) =>
            query.orderBy(field, direction[index])
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
          console.log(e);
        }
      }

      const result = await query.orderBy('hive.name');
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async getTreatmentYear(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { filters } = req.query as any;
      const query = Treatment.query()
        .select(Treatment.raw('YEAR(date) as year'))
        .countDistinct('hive_id as hive_count')
        .sum('amount as amount_sum')
        .avg('amount as amount_avg')
        .withGraphJoined('treatment_apiary as task_apiary')
        .groupBy('year')
        .where({
          'treatments.deleted': false,
          'treatments.user_id': req.user.user_id,
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
          console.error(e);
        }
      }
      const result = await query;
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async getTreatmentApiary(
    req: IUserRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { filters } = req.query as any;
      const query = Treatment.query()
        .countDistinct('hive_id as hive_count')
        .sum('amount as amount_sum')
        .avg('amount as amount_avg')
        .withGraphJoined('treatment_apiary as task_apiary')
        .groupBy('apiary_id')
        .where({
          'treatments.deleted': false,
          'treatments.user_id': req.user.user_id,
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
          console.error(e);
        }
      } else {
        query.whereRaw(`YEAR(date) = ${new Date().getFullYear()}`);
      }
      const result = await query;
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async getTreatmentType(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { filters } = req.query as any;
      const query = Treatment.query()
        .countDistinct('hive_id as hive_count')
        .sum('amount as amount_sum')
        .avg('amount as amount_avg')
        .withGraphJoined('treatment_apiary as task_apiary')
        .withGraphJoined('type')
        .groupBy('type_id')
        .where({
          'treatments.deleted': false,
          'treatments.user_id': req.user.user_id,
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
          console.error(e);
        }
      } else {
        query.whereRaw(`YEAR(date) = ${new Date().getFullYear()}`);
      }
      const result = await query;
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
