import { BaseModel } from '@models/base.model';
import { Company } from '@models/company.model';
import { ChargeType } from '@/api/models/option/charge_type.model';

export class ChargeStock extends BaseModel {
  sum_in!: number;
  sum_out!: number;
  sum!: number;
  type_id!: number;
  user_id!: string;

  static tableName = 'charge_stocks';
  static idColumn = 'user_id';

  type?: ChargeType;
  company?: Company;

  static jsonSchema = {};

  static relationMappings = () => ({
    type: {
      relation: BaseModel.HasOneRelation,
      modelClass: ChargeType,
      join: {
        from: ['charge_stocks.type_id'],
        to: ['charge_types.id'],
      },
    },
    company: {
      relation: BaseModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['charge_stocks.user_id'],
        to: ['company.id'],
      },
    },
  });
}
