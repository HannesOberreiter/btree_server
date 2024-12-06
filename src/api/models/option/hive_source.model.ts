import { ExtModel } from '../base.model.js';
import { Company } from '../company.model.js';
import { BaseOptionModel } from './baseoption.model.js';

export class HiveSource extends BaseOptionModel {
  static tableName = 'hive_sources';

  constructor() {
    super();
  }

  static relationMappings = {
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['hive_sources.user_id'],
        to: ['companies.id'],
      },
    },
  };
}
