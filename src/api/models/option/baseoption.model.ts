import { ExtModel } from '@models/base.model';
import { Company } from '@models/company.model';

export class BaseOptionModel extends ExtModel {
  id!: number;
  name!: string;
  modus!: boolean;
  favorite!: boolean;
  deleted!: boolean;
  user_id!: number;

  company?: Company;

  constructor() {
    super();
  }

  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    required: ['name'],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', minLength: 1, maxLength: 45 },
      favorite: { type: 'boolean' },
      modus: { type: 'boolean' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' }
    }
  };

  static relationMappings = () => ({
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['user_id'],
        to: ['company.id']
      }
    }
  });
}
