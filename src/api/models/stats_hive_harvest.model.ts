import { Model } from 'objection';
import { Hive } from './hive.model';
import { HarvestType } from './option/harvest_type.model';

export class StatsHiveHarvest extends Model {
  hive_id!: number;
  year!: number;
  quarter!: number;
  type_id!: number;
  sum_amount!: number;
  sum_frames!: number;

  hive?: Hive;
  type?: HarvestType;

  static tableName = 'stats_hives_harvests';
  static idColumn = 'hive_id';

  static jsonSchema = {};

  static relationMappings = () => ({
    hive: {
      relation: Model.BelongsToOneRelation,
      modelClass: Hive,
      join: {
        from: 'hives.id',
        to: 'stats_hives_harvests.hive_id',
      },
    },
    type: {
      relation: Model.BelongsToOneRelation,
      modelClass: HarvestType,
      join: {
        from: 'harvest_types.id',
        to: 'stats_hives_harvests.type_id',
      },
    },
  });
}
