import { ExtModel } from './base.model.js';
import { User } from './user.model.js';
import { CompanyBee } from './company_bee.model.js';
import dayjs from 'dayjs';
export class Company extends ExtModel {
  id!: number;
  name!: string;
  image!: string;
  paid!: string;
  api_active!: boolean;
  api_key!: string;

  static tableName = 'companies';
  static idColumn = 'id';

  user?: User[];

  isPaid(): boolean {
    return dayjs(this.paid) > dayjs();
  }

  static jsonSchema = {
    type: 'object',
    required: ['name'],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', minLength: 3, maxLength: 45 },
      paid: { type: 'string', format: 'date' },

      image: { type: 'string', minLength: 1, maxLength: 65 },
      api_active: { type: 'boolean' },
      api_key: { type: 'string', minLength: 1, maxLength: 65 },

      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  };

  // Omit fields for json response from model
  $formatJson(company: Company): Company {
    super.$formatJson(company);

    delete company.image;

    return company;
  }

  static relationMappings = () => ({
    user: {
      relation: ExtModel.ManyToManyRelation,
      modelClass: User,
      join: {
        from: 'companies.id',
        through: {
          modelClass: CompanyBee,
          from: 'company_bee.user_id',
          to: 'company_bee.bee_id',
        },
        to: 'bees.id',
      },
    },
  });
}
