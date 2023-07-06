import { BaseOptionModel } from '@models/option/baseoption.model';
import { ExtModel } from '../base.model';
import { Company } from '../company.model';

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
