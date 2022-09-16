import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { ScaleData } from '../models/scale_data.model';
import dayjs from 'dayjs';
import { getCompany } from '../utils/api.util';
import { isPremium } from '../utils/premium.util';
import { paymentRequired, tooManyRequests } from '@hapi/boom';
import { Scale } from '../models/scale.model';
import { User } from '../models/user.model';
import { MailServer } from '../app.bootstrap';

export class ScaleDataController extends Controller {
  constructor() {
    super();
  }
  async api(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const insertDate = req.query.datetime ? req.query.datetime : new Date();
      const company = await getCompany(req.params.api);
      const premium = await isPremium(company.id);
      if (!premium) throw paymentRequired();

      const result = await ScaleData.transaction(async (trx) => {
        const scale = await Scale.query(trx)
          .select()
          .where({ name: req.params.ident, user_id: company.id })
          .throwIfNotFound()
          .first();
        const lastInsert = await ScaleData.query(trx)
          .select()
          .where({ scale_id: scale.id })
          .orderBy('datetime', 'DESC')
          .first();
        if (lastInsert && req.query.action === 'CREATE') {
          if (
            dayjs(lastInsert.datetime) >
            dayjs(insertDate as any).subtract(1, 'hour')
          )
            throw tooManyRequests('you have exceeded your request limit');
        }

        if (
          req.query.weight &&
          lastInsert.weight &&
          req.query.action === 'CREATE'
        ) {
          try {
            const currentWeight = parseFloat(req.query.weight as any);
            const checkWeight = Math.abs(lastInsert.weight - currentWeight);
            if (checkWeight > 5) {
              const user = await User.query()
                .leftJoinRelated('company_bee')
                .where({
                  'company_bee.rank': 1,
                  'company_bee.user_id': company.id,
                });
              user.forEach((u) => {
                MailServer.sendMail({
                  to: u.email,
                  lang: u.lang,
                  subject: 'weight_warning',
                  key: `${scale.name}: ${checkWeight} (${lastInsert.weight} - ${currentWeight})`,
                  name: u.username,
                });
              });
            }
          } catch (e) {
            console.error(e);
          }
        }
        const insert = {
          datetime: insertDate,
          weight: req.query.weight ? req.query.weight : 0,
          temp1: req.query.temp1 ? req.query.temp1 : 0,
          temp2: req.query.temp2 ? req.query.temp2 : 0,
          rain: req.query.rain ? req.query.rain : 0,
          humidity: req.query.hum ? req.query.hum : 0,
          note: req.query.note ? req.query.note : '',
          scale_id: scale.id,
        } as any;
        if (req.query.action === 'CREATE_DEMO') return insert;
        const query = await ScaleData.query(trx).insert({ ...insert });
        return query;
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async get(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, offset, limit, q, filters } = req.query as any;
      const query = ScaleData.query()
        .withGraphJoined('[scale.hive]')
        .where({
          'scale.user_id': req.user.user_id,
        })
        .page(
          offset ? offset : 0,
          parseInt(limit) === 0 || !limit ? 10 : limit
        );

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
          console.error(e);
        }
      }
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
            builder.orWhere('scale.name', 'like', `%${q}%`);
          });
        }
      }
      const result = await query.orderBy('id');
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async patch(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const ids = req.body.ids;
      const insert = { ...req.body.data };
      const result = await ScaleData.transaction(async (trx) => {
        return await ScaleData.query(trx)
          .withGraphJoined('scale')
          .patch({ ...insert })
          .findByIds(ids)
          .where('scale.user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async post(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const insert = req.body;
      const result = await ScaleData.transaction(async (trx) => {
        return await ScaleData.query(trx)
          .withGraphJoined('scale')
          .insertGraphAndFetch({
            ...insert,
          })
          .where('scale.user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async batchGet(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await ScaleData.transaction(async (trx) => {
        const res = await ScaleData.query(trx)
          .findByIds(req.body.ids)
          .withGraphJoined('scale')
          .where('scale.user_id', req.user.user_id);
        return res;
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async batchDelete(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await ScaleData.transaction(async (trx) => {
        return await ScaleData.query(trx)
          .delete()
          .withGraphJoined('scale')
          .where('scale.user_id', req.user.user_id)
          .findByIds(req.body.ids);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
