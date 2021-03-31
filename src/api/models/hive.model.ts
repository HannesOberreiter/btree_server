import { BaseModel } from '@models/base.model';
import { User } from '@models/user.model';

export class Hive extends BaseModel {
  id!: number;
  name!: string;
  grouphive!: number;
  position!: number;
  note!: string;
  url!: string;
  modus!: boolean;
  modus_date!: Date;
  deleted!: boolean;

  static tableName = 'hives';
  static idColumn = 'id';

  creator?: User;
  editor?: User;

  static jsonSchema = {
    type: 'object',
    required: ['name'],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', minLength: 1, maxLength: 45 },
      grouphive: { type: 'integer' },
      position: { type: 'integer' },
      note: { type: 'string', maxLength: 2000 },

      modus: { type: 'boolean' },
      modus_date: { type: 'date' },
      deleted: { type: 'boolean' },
      deleted_at: { type: 'date-time' },

      created_at: { type: 'date-time' },
      updated_at: { type: 'date-time' },

      bee_id: { type: 'integer' }, // Creator Bee FK
      edit_id: { type: 'integer' } // Updater Bee FK
    }
  };

  static relationMappings = () => ({
    creator: {
      relation: BaseModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['apiaries.bee_id'],
        to: ['bees.id']
      }
    },
    editor: {
      relation: BaseModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['apiaries.edit_id'],
        to: ['bees.id']
      }
    }
  });
}
