import { BaseOptionModel } from './baseoption.model.js';
import { ExtModel } from '../base.model.js';
import { Company } from '../company.model.js';

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
