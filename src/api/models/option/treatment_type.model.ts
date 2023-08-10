import { BaseOptionModel } from './baseoption.model.js';
import { ExtModel } from '../base.model.js';
import { Company } from '../company.model.js';

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
        to: ['companies.id'],
      },
    },
  };
}
