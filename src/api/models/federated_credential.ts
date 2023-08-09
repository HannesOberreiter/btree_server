import { User } from '@models/user.model';
import { BaseModel } from '@models/base.model';

export class FederatedCredential extends BaseModel {
  id!: number;
  provider!: string;
  provider_id!: string;
  mail!: string;
  bee_id!: number;
  last_visit!: Date;

  user?: User;

  static tableName = 'federated_credentials';
  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      provider: { type: 'string', maxLength: 45 },
      provider_id: { type: 'string', maxLength: 45 },
      mail: { type: 'string', maxLength: 100 },
      bee_id: { type: 'integer' }, // User FK
      created_at: { type: 'string', format: 'date-time' },
      last_login: { type: 'string', format: 'date-time' },
    },
  };

  static relationMappings = () => ({
    user: {
      relation: BaseModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['federated_credentials.bee_id'],
        to: ['bees.id'],
      },
    },
  });
}
