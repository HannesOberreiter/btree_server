import { Model } from 'objection';
import { Apiary } from './apiary.model.js';
import { ExtModel } from './base.model.js';
import { Hive } from './hive.model.js';
import { MovedateCount } from './movedate_count.model.js';
import { MovedatePreviousApiary } from './movedate_previous_apiary.model.js';
import { User } from './user.model.js';

export class Movedate extends ExtModel {
  id!: number;
  date!: string;
  apiary_id!: number;
  hive_id!: number;
  edit_id!: number;
  bee_id!: number;

  apiary?: Apiary;
  hive?: Hive;
  creator?: User;
  editor?: User;
  movedate_count?: MovedateCount;

  static tableName = 'movedates';
  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    required: ['date', 'apiary_id', 'hive_id'],
    properties: {
      id: { type: 'integer' },
      date: { type: 'string', format: 'iso-date-time' },
      edit_id: { type: 'integer' },
      apiary_id: { type: 'integer' }, // Apiary FK
      hive_id: { type: 'integer' }, // Hive FK
    },
  };

  static relationMappings = () => ({
    apiary: {
      relation: Model.BelongsToOneRelation,
      modelClass: Apiary,
      join: {
        from: 'movedates.apiary_id',
        to: 'apiaries.id',
      },
    },
    hive: {
      relation: Model.BelongsToOneRelation,
      modelClass: Hive,
      join: {
        from: 'movedates.hive_id',
        to: 'hives.id',
      },
    },
    movedate_count: {
      relation: Model.BelongsToOneRelation,
      modelClass: MovedateCount,
      join: {
        from: 'movedates.hive_id',
        to: 'movedates_counts.hive_id',
      },
    },
    movedate_previous_apiary: {
      relation: Model.BelongsToOneRelation,
      modelClass: MovedatePreviousApiary,
      join: {
        from: 'movedates.id',
        to: 'movedates_previous_apiary.current_move_id',
      },
    },
    creator: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['movedates.bee_id'],
        to: ['bees.id'],
      },
    },
    editor: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['movedates.edit_id'],
        to: ['bees.id'],
      },
    },
  });
}
