import { BaseOptionModel } from '@models/option/baseoption.model';
import { ExtModel } from '../base.model';
import { Company } from '../company.model';

export class TreatmentDisease extends BaseOptionModel {
  static tableName = 'treatment_diseases';

  constructor() {
    super();
  }
  static relationMappings = {
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['treatment_diseases.user_id'],
        to: ['companies.id'],
      },
    },
  };
}
