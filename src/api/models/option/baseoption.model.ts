import { ExtModel } from '../base.model.js';
import { Company } from '../company.model.js';

export class BaseOptionModel extends ExtModel {
  id!: number;
  name!: string;
  modus!: boolean;
  favorite!: boolean;
  deleted!: boolean;
  user_id!: number;
  company?: Company;

  static idColumn = 'id';

  constructor() {
    super();
  }

  static jsonSchema = {
    type: 'object',
    required: ['name'],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', minLength: 1, maxLength: 45 },
      favorite: { type: 'boolean' },
      modus: { type: 'boolean' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  };
}
