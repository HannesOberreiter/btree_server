import { ExtModel } from '../base.model.js';
import { Company } from '../company.model.js';
import { BaseOptionModel } from './baseoption.model.js';

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
