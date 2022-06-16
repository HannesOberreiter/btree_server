import { BaseOptionModel } from '@models/option/baseoption.model';
import { ExtModel } from '../base.model';
import { Company } from '../company.model';

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
        to: ['companies.id']
      }
    }
  }
}
