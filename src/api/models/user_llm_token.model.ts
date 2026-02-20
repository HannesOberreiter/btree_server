import { BaseModel, ExtModel } from './base.model.js';
import { User } from './user.model.js';

export class UserLlmToken extends ExtModel {
  id!: number;
  bee_id!: number;
  provider!: string;
  tokens!: string;

  user?: User;

  static tableName = 'user_llm_tokens';
  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    required: ['bee_id', 'provider', 'tokens'],
    properties: {
      id: { type: 'integer' },
      bee_id: { type: 'integer' },
      provider: { type: 'string', maxLength: 50 },
      tokens: { type: 'string' },
    },
  };

  static relationMappings = () => ({
    user: {
      relation: BaseModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['user_llm_tokens.bee_id'],
        to: ['bees.id'],
      },
    },
  });
}
