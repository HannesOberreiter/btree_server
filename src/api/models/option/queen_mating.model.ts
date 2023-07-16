import { BaseOptionModel } from '@models/option/baseoption.model';
import { ExtModel } from '../base.model';
import { Company } from '../company.model';

export class QueenMating extends BaseOptionModel {
  static tableName = 'queen_matings';

  constructor() {
    super();
  }
  static relationMappings = {
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['queen_matings.user_id'],
        to: ['companies.id'],
      },
    },
  };
}
