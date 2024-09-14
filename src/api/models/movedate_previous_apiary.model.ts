import { Model } from 'objection';
import { Movedate } from './movedate.model.js';

export class MovedatePreviousApiary extends Model {
  current_move_id!: number;
  current_move_date!: string;
  hive_id!: number;
  previous_apiary_id!: number;
  previous_apiary_name!: string;

  movedate?: Movedate;

  static tableName = 'movedates_previous_apiary';
  static idColumn = 'current_move_id';

  static relationMappings = () => ({
    movedate: {
      relation: Model.BelongsToOneRelation,
      modelClass: Movedate,
      join: {
        from: 'movedates_previous_apiary.current_move_id',
        to: 'movedates.id',
      },
    },
  });
}
