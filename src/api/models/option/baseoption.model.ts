import { BaseModel } from '@models/base.model';
import { Company } from '@models/company.model';

export class BaseOptionModel extends BaseModel {
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
      favorite: { type: 'favorite' },
      modus: { type: 'boolean' },
      created_at: { type: 'date-time' },
      updated_at: { type: 'date-time' }
    }
  };

  static relationMappings = () => ({
    company: {
      relation: BaseModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['user_id'],
        to: ['company.id']
      }
    }
  });
}
