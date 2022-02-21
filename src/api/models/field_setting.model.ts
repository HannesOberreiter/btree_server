import { User } from '@models/user.model';
import { BaseModel } from '@models/base.model';

export class FieldSetting extends BaseModel {
  id!: number;
  settings!: JSON;
  bee_id!: number;

  static tableName = 'field_settings';
  static idColumn = 'id';

  user?: User;

  static jsonSchema = {
    type: 'object',
    required: ['settings'],
    properties: {
      id: { type: 'integer' },
      settings: { type: 'object' },
      bee_id: { type: 'integer' }
    }
  };

  static relationMappings = () => ({
    user: {
      relation: BaseModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['field_settings.bee_id'],
        to: ['bee.id']
      }
    }
  });
}
