import { Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { ChargeType } from '@models/option/charge_type.model';
import { CheckupType } from '@models/option/checkup_type.model';
import dayjs from 'dayjs';
import { FeedType } from '@models/option/feed_type.model';
import { HarvestType } from '@models/option/harvest_type.model';
import { TreatmentType } from '@models/option/treatment_type.model';
import { TreatmentDisease } from '@models/option/treatment_disease.model';
import { TreatmentVet } from '@models/option/treatment_vet.model';
export class OptionController extends Controller {
  constructor() {
    super();
  }

  async getDropdowns(req: IUserRequest, res: Response, next) {
    const types = [
      ChargeType,
      CheckupType,
      FeedType,
      HarvestType,
      TreatmentDisease,
      TreatmentType,
      TreatmentVet
    ];
    let results = {};
    for (let i of types) {
      const result = await i
        .query()
        .where({ user_id: req.user.user_id, modus: 1 })
        .orderBy([{ column: 'favorite', order: 'desc' }, { column: 'name' }]);
      results[i.name] = result;
    }
    res.locals.data = {
      data: results,
      meta: {
        timestamp: dayjs()
      }
    };
    next();
  }
}
