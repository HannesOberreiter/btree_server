import { Model } from 'objection';

export class Counts extends Model {
  user_id!: number;
  count!: number;
  kind!: string;

  static tableName = 'counts';
  static idColumn = 'user_id';

  static jsonSchema = {};
}
