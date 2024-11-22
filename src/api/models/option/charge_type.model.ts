import { ChargeStock } from '../charge_stock.model.js';
import { Company } from '../company.model.js';
import { BaseOptionModel } from './baseoption.model.js';

export class ChargeType extends BaseOptionModel {
  static tableName = 'charge_types';

  stock?: ChargeStock;

  constructor() {
    super();
    const newSchema: any = BaseOptionModel.jsonSchema;
    newSchema.properties.unit = { type: 'string' };
    ChargeType.jsonSchema = newSchema;
  }

  static relationMappings = {
    company: {
      relation: ChargeType.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['charge_types.user_id'],
        to: ['companies.id'],
      },
    },
    stock: {
      relation: ChargeType.HasOneRelation,
      modelClass: ChargeStock,
      join: {
        from: ['charge_types.id'],
        to: ['charge_stocks.type_id'],
      },
    },
  };
}
