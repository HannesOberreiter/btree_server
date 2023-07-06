import { BaseOptionModel } from '@models/option/baseoption.model';
import { ExtModel } from '../base.model';
import { Company } from '../company.model';

export class CheckupType extends BaseOptionModel {
  static tableName = 'checkup_types';

  constructor() {
    super();
  }

  static relationMappings = {
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['checkup_types.user_id'],
        to: ['companies.id'],
      },
    },
  };
}
