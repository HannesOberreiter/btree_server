import { Model } from 'objection';
import { Company } from './company.model';

export class Dropbox extends Model {
  id!: number;
  refresh_token!: string;
  access_token!: string;
  user_id!: number;
  company?: Company;

  static tableName = 'dropbox';
  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    required: ['refresh_token', 'access_token', 'user_id'],
    properties: {
      refresh_token: { type: 'string', minLength: 1, maxLength: 200 },
      access_token: { type: 'string', minLength: 1, maxLength: 200 },
      user_id: { type: 'integer' },
    },
  };
  static relationMappings = () => ({
    company: {
      relation: Model.BelongsToOneRelation,
      modelClass: Company,
      join: {
        from: 'dropbox.user_id',
        to: 'companies.id',
      },
    },
  });
}
