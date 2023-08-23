import { Model } from 'objection';
import { Company } from './company.model.js';
import { Hive } from './hive.model.js';
import { ScaleData } from './scale_data.model.js';

export class Scale extends Model {
  id!: number;
  name: string;

  hive_id!: number;
  user_id!: number;

  hive?: Hive;
  company?: Company;
  scale_data?: ScaleData;

  static tableName = 'scales';
  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 45 },
      hive_id: { type: ['integer', 'null'] },
      user_id: { type: 'integer' },
    },
  };
  static relationMappings = () => ({
    scale_data: {
      relation: Model.HasManyRelation,
      modelClass: ScaleData,
      join: {
        from: 'scales.id',
        to: 'scale_data.scale_id',
      },
    },
    hive: {
      relation: Model.BelongsToOneRelation,
      modelClass: Hive,
      join: {
        from: 'scales.hive_id',
        to: 'hives.id',
      },
    },
    company: {
      relation: Model.BelongsToOneRelation,
      modelClass: Company,
      join: {
        from: 'scales.user_id',
        to: 'companies.id',
      },
    },
  });
}
