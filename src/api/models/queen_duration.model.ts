import { Model } from 'objection';
import { Hive } from './hive.model';
import { HiveLocation } from './hive_location.model';
import { Queen } from './queen.model';

export class QueenDuration extends Model {
  hive_id!: number;
  id!: number;
  user_id!: number;
  move_date!: string;
  last_date!: string;
  duration!: number;

  hive?: Hive;
  queen?: Queen;
  hive_location?: HiveLocation;

  static tableName = 'queen_durations';
  static idColumn = 'id';

  static jsonSchema = {};

  static relationMappings = () => ({
    hive: {
      relation: Model.BelongsToOneRelation,
      modelClass: Hive,
      join: {
        from: 'hives.id',
        to: 'queen_durations.hive_id',
      },
    },
    hive_location: {
      relation: Model.BelongsToOneRelation,
      modelClass: HiveLocation,
      join: {
        from: 'hives_locations.hive_id',
        to: 'queen_durations.hive_id',
      },
    },
    queen: {
      relation: Model.BelongsToOneRelation,
      modelClass: Queen,
      join: {
        from: 'queens.id',
        to: 'queen_durations.id',
      },
    },
  });
}
