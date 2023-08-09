import { BaseModel } from './base.model.js';
import { Company } from './company.model.js';

export class Payment extends BaseModel {
  id!: number;
  type!: string;
  amount!: number;
  date!: Date;
  user_id!: number;

  static tableName = 'payments';
  static idColumn = 'id';

  company?: Company;

  static jsonSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      type: { type: 'string', minLength: 0, maxLength: 45 },
      amount: { type: 'number' },
      date: { type: 'string', format: 'date-time' },
      user_id: { type: 'integer' }, // Company FK
    },
  };

  static relationMappings = () => ({
    company: {
      relation: BaseModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['payments.user_id'],
        to: ['company.id'],
      },
    },
  });
}
