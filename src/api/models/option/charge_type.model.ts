import { BaseOptionModel } from '@models/option/baseoption.model';

export class ChargeType extends BaseOptionModel {
  static tableName = 'charge_types';

  constructor() {
    super();
    const newSchema: any = BaseOptionModel.jsonSchema;
    newSchema.properties.unit = { type: 'string' };
    ChargeType.jsonSchema = newSchema;
  }
}
