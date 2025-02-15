import { ExtModel } from '../base.model.js';
import { Company } from '../company.model.js';
import { BaseOptionModel } from './baseoption.model.js';

export class HiveType extends BaseOptionModel {
  static tableName = 'hive_types';

  constructor() {
    super();
  }

  static relationMappings = {
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['hive_types.user_id'],
        to: ['companies.id'],
      },
    },
  };
}
