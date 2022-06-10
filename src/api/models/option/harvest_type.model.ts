import { BaseOptionModel } from '@models/option/baseoption.model';
import { ExtModel } from '../base.model';
import { Company } from '../company.model';

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
        to: ['companies.id']
      }
    }
  }
}
