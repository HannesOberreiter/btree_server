import { ExtModel } from '@models/base.model';
import { Hive } from '@models/hive.model';
import { User } from '@models/user.model';
import { FeedType } from '@models/option/feed_type.model';
import { FeedApiary } from '@models/feed_apiary.model';

export class Feed extends ExtModel {
  id!: number;
  date!: Date;
  enddate!: Date;
  amount!: number;
  note!: string;
  url!: string;
  done!: boolean;
  deleted!: boolean;
  edit_id!: number;

  static tableName = 'feeds';
  static idColumn = 'id';

  type?: FeedType;
  feed_apiary?: FeedApiary;
  hive?: Hive;
  creator?: User;
  editor?: User;

  static jsonSchema = {
    type: 'object',
    required: ['date', 'hive_id'],
    properties: {
      id: { type: 'integer' },
      date: { type: 'string', format: 'date' },
      enddate: { type: 'string', format: 'date' },
      amount: { type: 'number' },
      note: { type: 'string', maxLength: 2000 },
      url: { type: 'string', maxLength: 512 },

      done: { type: 'boolean' },

      deleted: { type: 'boolean' },
      deleted_at: { type: 'string', format: 'date-time' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },

      type_id: { type: 'integer' }, // Type FK
      bee_id: { type: 'integer' }, // Creator Bee FK
      edit_id: { type: 'integer' } // Updater Bee FK
    }
  };

  static relationMappings = () => ({
    type: {
      relation: ExtModel.HasOneRelation,
      modelClass: FeedType,
      join: {
        from: ['feeds.type_id'],
        to: ['feed_types.id']
      }
    },
    hive: {
      relation: ExtModel.HasOneRelation,
      modelClass: Hive,
      join: {
        from: ['feeds.hive_id'],
        to: ['hives.id']
      }
    },
    feed_apiary: {
      relation: ExtModel.HasOneRelation,
      modelClass: FeedApiary,
      join: {
        from: ['feeds_apiaries.feed_id'],
        to: ['feeds.id']
      }
    },
    creator: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['feeds.bee_id'],
        to: ['bees.id']
      }
    },
    editor: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['feeds.edit_id'],
        to: ['bees.id']
      }
    }
  });
}
