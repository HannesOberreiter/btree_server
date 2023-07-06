import { BaseOptionModel } from '@models/option/baseoption.model';
import { ExtModel } from '../base.model';
import { Company } from '../company.model';

export class QueenRace extends BaseOptionModel {
  static tableName = 'queen_races';

  constructor() {
    super();
  }
  static relationMappings = {
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['queen_races.user_id'],
        to: ['companies.id'],
      },
    },
  };
}
