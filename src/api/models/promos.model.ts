import { BaseModel } from '@models/base.model';
import { Company } from '@models/company.model';

export class Promo extends BaseModel {
  id!: number;
  code!: string;
  months!: number;
  date!: Date;
  used!: boolean;
  user_id!: number

  static tableName = 'promos';
  static idColumn = 'id';

  company?: Company;

  static jsonSchema = {
    type: 'object',
    required: ['code'],
    properties: {
      id: { type: 'integer' },
      code: { type: 'string', minLength: 3, maxLength: 128 },
      months: { type: 'integer', maxLength: 11},
      date: { type: 'string', format: 'date-time' },
      used: { type: 'boolean' },
      user_id: { type: 'integer' }, // Company FK
    },
  };

  static relationMappings = () => ({
    company: {
      relation: BaseModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['promos.user_id'],
        to: ['company.id'],
      },
    },
  });
}
