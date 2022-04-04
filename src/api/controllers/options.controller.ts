import { Response } from 'express';
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
    treatment_vets: TreatmentVet
  };

  async get(req: IUserRequest, res: Response, next) {
    try {
      const { order, direction, modus, q } = req.query as any;
      const table = Object(OptionController.tables)[req.params.table];
      const query = table
        .query()
        .where({ user_id: req.user.user_id, modus: modus === 'true' });

      if (Array.isArray(order)) {
        order.forEach((field, index) => query.orderBy(field, direction[index]));
      } else {
        query.orderBy(order, direction);
      }

      if (q.trim() !== '') {
        query.where((builder) => {
          builder.orWhere('name', 'like', `%${q}%`);
        });
      }

      res.locals.data = await query;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
