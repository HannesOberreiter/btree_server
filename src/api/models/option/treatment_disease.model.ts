import { ExtModel } from '../base.model.js';
import { Company } from '../company.model.js';
import { BaseOptionModel } from './baseoption.model.js';

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
