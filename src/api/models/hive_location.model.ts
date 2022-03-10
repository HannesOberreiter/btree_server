import { Apiary } from '@models/apiary.model';
import { Model } from 'objection';
import { Hive } from './hive.model';

export class HiveLocation extends Model {
  apiary_id!: number;
  user_id!: number;
  move_id!: number;
  apiary_name!: string;
  hive_id!: number;
  hive_name!: string;
  hive_modus!: boolean;
  hive_deleted!: boolean;

  apiary?: Apiary;
  hive?: Hive;

  static tableName = 'hives_locations';
  static idColumn = 'move_id';

  static jsonSchema = {};

  static relationMappings = () => ({
    apiary: {
      relation: Model.BelongsToOneRelation,
      modelClass: Apiary,
      join: {
        from: 'apiaries.id',
        to: 'hives_locations.apiary_id'
      }
    },
    hive: {
      relation: Model.BelongsToOneRelation,
      modelClass: Hive,
      join: {
        from: 'hives.id',
        to: 'hives_locations.hive_id'
      }
    }
  });
}
