import { BaseModel, ExtModel } from '@models/base.model';
import { User } from './user.model';

export class WizBeeToken extends ExtModel {
  id!: number;
  date!: string;
  usedTokens!: number;
  countQuestions!: number;
  bee_id!: number;

  user?: User;

  static tableName = 'wizbee_tokens';
  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    required: ['date'],
    properties: {
      id: { type: 'integer' },
      date: { type: 'string', format: 'date' },
      usedTokens: { type: 'integer' },
      countQuestions: { type: 'integer' },
      bee_id: { type: 'integer' },
    },
  };

  static relationMappings = () => ({
    user: {
      relation: BaseModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['wizbee_tokens.bee_id'],
        to: ['bees.id'],
      },
    },
  });
}
