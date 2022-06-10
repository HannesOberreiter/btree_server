import { BaseOptionModel } from '@models/option/baseoption.model';
import { ExtModel } from '../base.model';
import { Company } from '../company.model';

export class TreatmentType extends BaseOptionModel {
  static tableName = 'treatment_types';

  constructor() {
    super();
  }
  static relationMappings = {
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['treatment_types.user_id'],
        to: ['companies.id']
      }
    }
  }
}
