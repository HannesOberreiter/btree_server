import { Model } from 'objection';
import { Apiary } from './apiary.model.js';

export class HiveCount extends Model {
  id!: number;
  apiary_name!: string;
  count!: number;
  grouphivescount!: number;

  apiary?: Apiary;

  static tableName = 'hives_counts';
  static idColumn = 'id';

  static jsonSchema = {};

  static relationMappings = () => ({
    apiary: {
      relation: Model.BelongsToOneRelation,
      modelClass: Apiary,
      join: {
        from: 'apiaries.id',
        to: 'hives_counts.id',
      },
    },
  });
}
