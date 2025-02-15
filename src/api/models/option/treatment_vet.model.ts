import { ExtModel } from '../base.model.js';
import { Company } from '../company.model.js';
import { BaseOptionModel } from './baseoption.model.js';

export class TreatmentVet extends BaseOptionModel {
  static tableName = 'treatment_vets';

  constructor() {
    super();
  }

  static relationMappings = {
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['treatment_vets.user_id'],
        to: ['companies.id'],
      },
    },
  };
}
