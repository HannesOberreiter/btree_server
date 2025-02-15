import { ExtModel } from '../base.model.js';
import { Company } from '../company.model.js';
import { BaseOptionModel } from './baseoption.model.js';

export class HarvestType extends BaseOptionModel {
  static tableName = 'harvest_types';

  constructor() {
    super();
  }

  static relationMappings = {
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['harvest_types.user_id'],
        to: ['companies.id'],
      },
    },
  };
}
