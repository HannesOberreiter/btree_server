import { BaseOptionModel } from './baseoption.model.js';
import { ExtModel } from '../base.model.js';
import { Company } from '../company.model.js';

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
