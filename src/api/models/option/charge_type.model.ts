import { BaseOptionModel } from '@models/option/baseoption.model';
import { ExtModel } from '../base.model';
import { Company } from '../company.model';

export class ChargeType extends BaseOptionModel {
  static tableName = 'charge_types';

  constructor() {
    super();
    const newSchema: any = BaseOptionModel.jsonSchema;
    newSchema.properties.unit = { type: 'string' };
    ChargeType.jsonSchema = newSchema;
  }

  static relationMappings = {
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['charge_types.user_id'],
        to: ['companies.id']
      }
    }
  }
}
