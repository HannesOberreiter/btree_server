import { User } from './user.model.js';
import { BaseModel } from './base.model.js';

export class LoginAttemp extends BaseModel {
  id!: number;
  time!: string;
  bee_id!: number;

  user?: User;

  static tableName = 'login_attempts';

  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      time: { type: 'string', format: 'iso-date-time' },
      bee_id: { type: 'integer' }, // User FK
    },
  };

  static relationMappings = () => ({
    user: {
      relation: BaseModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['login_attempts.bee_id'],
        to: ['bees.id'],
      },
    },
  });
}
