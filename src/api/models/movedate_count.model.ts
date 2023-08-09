import { Model } from 'objection';
import { Hive } from './hive.model.js';
import { Movedate } from './movedate.model.js';

export class MovedateCount extends Model {
  hive_id!: number;
  count!: number;

  hive?: Hive;
  movedate?: Movedate;

  static tableName = 'movedates_counts';
  static idColumn = 'hive_id';

  static jsonSchema = {
    type: 'object',
    required: ['date', 'apiary_id', 'hive_id'],
    properties: {
      hive_id: { type: 'integer' },
      count: { type: 'integer' },
    },
  };

  static relationMappings = () => ({
    hive: {
      relation: Model.BelongsToOneRelation,
      modelClass: Hive,
      join: {
        from: 'movedates_counts.hive_id',
        to: 'hives.id',
      },
    },
    movedate: {
      relation: Model.HasManyRelation,
      modelClass: Movedate,
      join: {
        from: 'movedates_counts.hive_id',
        to: 'movedates.hive_id',
      },
    },
  });
}
