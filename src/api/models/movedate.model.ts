import { BaseModel } from '@models/base.model';
import { User } from '@models/user.model';
import { Model } from 'objection';
import { Apiary } from '@models/apiary.model';
import { Hive } from '@models/hive.model';

export class Movedate extends BaseModel {
  id!: number;
  date!: Date;
  apiary_id!: number;
  hive_id!: number;

  apiary?: Apiary;
  hive?: Hive;
  creator?: User;
  editor?: User;

  static tableName = 'movedates';
  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    required: ['date', 'apiary_id', 'hive_id'],
    properties: {
      id: { type: 'integer' },
      date: { type: 'date' },
      apiary_id: { type: 'integer' }, // Apiary FK
      hive_id: { type: 'integer' } // Hive FK
    }
  };

  static relationMappings = () => ({
    apiary: {
      relation: Model.BelongsToOneRelation,
      modelClass: Apiary,
      join: {
        from: 'movedates.apiary_id',
        to: 'apiaries.id'
      }
    },
    hive: {
      relation: Model.BelongsToOneRelation,
      modelClass: Hive,
      join: {
        from: 'movedates.hive_id',
        to: 'hives.id'
      }
    },
    creator: {
      relation: BaseModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['movedates.bee_id'],
        to: ['bees.id']
      }
    },
    editor: {
      relation: BaseModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['movedates.edit_id'],
        to: ['bees.id']
      }
    }
  });
}
