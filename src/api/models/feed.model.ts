import { BaseModel } from '@models/base.model';
import { Hive } from '@models/hive.model';
import { User } from '@models/user.model';
import { FeedType } from '@models/option/feed_type.model';

export class Feed extends BaseModel {
  id!: number;
  date!: Date;
  enddate!: Date;
  amount!: number;
  note!: string;
  url!: string;
  done!: boolean;
  deleted!: boolean;

  static tableName = 'feeds';
  static idColumn = 'id';

  type?: FeedType;
  company?: Hive;
  creator?: User;
  editor?: User;

  static jsonSchema = {
    type: 'object',
    required: ['date', 'hive_id'],
    properties: {
      id: { type: 'integer' },
      date: { type: 'date' },
      enddate: { type: 'date' },
      amount: { type: 'number' },
      note: { type: 'string', maxLength: 2000 },
      url: { type: 'string', maxLength: 512 },

      done: { type: 'boolean' },

      deleted: { type: 'boolean' },
      deleted_at: { type: 'date-time' },
      created_at: { type: 'date-time' },
      updated_at: { type: 'date-time' },

      type_id: { type: 'integer' }, // Type FK
      user_id: { type: 'integer' }, // Company FK
      bee_id: { type: 'integer' }, // Creator Bee FK
      edit_id: { type: 'integer' } // Updater Bee FK
    }
  };

  static relationMappings = () => ({
    type: {
      relation: BaseModel.HasOneRelation,
      modelClass: FeedType,
      join: {
        from: ['feeds.type_id'],
        to: ['feed_types.id']
      }
    },
    hive: {
      relation: BaseModel.HasOneRelation,
      modelClass: Hive,
      join: {
        from: ['feeds.hive_id'],
        to: ['hives.id']
      }
    },
    creator: {
      relation: BaseModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['feeds.bee_id'],
        to: ['bees.id']
      }
    },
    editor: {
      relation: BaseModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['feeds.edit_id'],
        to: ['bees.id']
      }
    }
  });
}
