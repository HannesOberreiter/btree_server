import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
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
export class OptionController extends Controller {
  constructor() {
    super();
  }

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

  async get(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const { order, direction, modus, q } = req.query as any;
      const table = Object(OptionController.tables)[req.params.table];
      const query = table.query().where('user_id', req.user.user_id);

      if (modus) {
        query.where('modus', modus === 'true');
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

      res.locals.data = await query;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async patch(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const ids = req.body.ids;
      const insert = { ...req.body.data };
      const table = Object(OptionController.tables)[req.params.table];
      const result = await table.transaction(async (trx) => {
        return await table
          .query(trx)
          .patch({ ...insert })
          .findByIds(ids)
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async post(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const insert = { ...req.body };
      const table = Object(OptionController.tables)[req.params.table];
      const result = await table.transaction(async (trx) => {
        return await table.query(trx).insert({
          ...insert,
          user_id: req.user.user_id,
        });
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async updateStatus(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const table = Object(OptionController.tables)[req.params.table];
      const result = await table.transaction(async (trx) => {
        return table
          .query(trx)
          .patch({
            modus: req.body.status,
          })
          .findByIds(req.body.ids)
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async updateFavorite(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const table = Object(OptionController.tables)[req.params.table];
      const result = await table.transaction(async (trx) => {
        await table
          .query(trx)
          .patch({ favorite: false })
          .where('user_id', req.user.user_id);

        return table
          .query(trx)
          .patch({ favorite: true })
          .findByIds(req.body.ids)
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async batchGet(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const table = Object(OptionController.tables)[req.params.table];
      const result = await table.transaction(async (trx) => {
        const res = await table
          .query(trx)
          .findByIds(req.body.ids)
          .where('user_id', req.user.user_id);
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
      const table = Object(OptionController.tables)[req.params.table];
      const result = await table.transaction(async (trx) => {
        return await table
          .query(trx)
          .delete()
          .findByIds(req.body.ids)
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
