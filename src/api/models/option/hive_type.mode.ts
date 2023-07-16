import { BaseOptionModel } from '@models/option/baseoption.model';
import { ExtModel } from '../base.model';
import { Company } from '../company.model';

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
