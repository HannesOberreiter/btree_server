import { Model } from 'objection';
import { Hive } from './hive.model';
import { Queen } from './queen.model';

export class QueenLocation extends Model {
  hive_id!: number;
  hive_name!: string;
  queen_id!: number;
  queen_name!: string;
  queen_move_date!: string;
  queen_mark_colour!: string;
  queen_modus!: boolean;
  queen_modus_date!: string;

  hive?: Hive;
  queen?: Queen;

  static tableName = 'queens_locations';
  static idColumn = 'queen_id';

  static jsonSchema = {};

  static relationMappings = () => ({
    hive: {
      relation: Model.BelongsToOneRelation,
      modelClass: Hive,
      join: {
        from: 'hive.id',
        to: 'queens_locations.hive_id'
      }
    },
    queen: {
      relation: Model.BelongsToOneRelation,
      modelClass: Queen,
      join: {
        from: 'queen.id',
        to: 'queens_locations.queen_id'
      }
    }
  });
}
