import { CompanyBee } from '@models/company_bee.model';
import { Model } from 'objection';
import { BaseModel } from '@models/base.model';

export class RefreshToken extends BaseModel {
  token!: string;
  expires!: Date;
  user_id!: number;
  bee_id!: number;

  'user-agent'!: string;

  company_bee?: CompanyBee;

  static tableName = 'refresh_tokens';

  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },

      token: { type: 'string', minLength: 10 },
      expires: { type: 'string', format: 'date-time' },
      'user-agent': { type: 'string', minLength: 1, maxLength: 65 },

      user_id: { type: 'integer' }, // Company FK
      bee_id: { type: 'integer' }, // User FK
    },
  };

  static relationMappings = () => ({
    company_bee: {
      relation: Model.BelongsToOneRelation,
      modelClass: CompanyBee,
      join: {
        from: ['refresh_tokens.user_id', 'refresh_tokens.bee_id'],
        to: ['company_bee.user_id', 'company_bee.bee_id'],
      },
    },
  });
}
