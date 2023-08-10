import { ExtModel } from './base.model.js';
import { User } from './user.model.js';
import { Company } from './company.model.js';
import { HiveCount } from './hive_count.model.js';
export class Apiary extends ExtModel {
  id!: number;
  name!: string;
  description!: string;
  latitude!: number;
  longitude!: number;
  note!: string;
  url!: string;
  modus!: boolean;
  deleted!: boolean;
  deleted_at!: string;
  user_id!: number;

  bee_id!: number;
  edit_id!: number;

  static tableName = 'apiaries';
  static idColumn = 'id';

  company?: Company;
  creator?: User;
  editor?: User;
  hive_count?: HiveCount;

  static jsonSchema = {
    $id: 'apiaries_schema',
    type: 'object',
    required: ['name'],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', minLength: 1, maxLength: 45 },
      description: { type: 'string', maxLength: 512 },
      latitude: { type: 'number', minimum: -90, maximum: 90, default: 0 },
      longitude: { type: 'number', minimum: -180, maximum: 180, default: 0 },
      note: { type: 'string', maxLength: 2000 },
      url: { type: 'string', maxLength: 512 },

      modus: { type: 'boolean' },
      deleted: { type: 'boolean' },
      deleted_at: { type: 'string', format: 'date-time' },

      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },

      user_id: { type: 'integer' }, // Company FK
      bee_id: { type: 'integer' }, // Creator Bee FK
      edit_id: { type: 'integer' }, // Updater Bee FK
    },
  };

  static relationMappings = () => ({
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['apiaries.user_id'],
        to: ['companies.id'],
      },
    },
    hive_count: {
      relation: ExtModel.HasOneRelation,
      modelClass: HiveCount,
      join: {
        from: ['hives_counts.id'],
        to: ['apiaries.id'],
      },
    },
    creator: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['apiaries.bee_id'],
        to: ['bees.id'],
      },
    },
    editor: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['apiaries.edit_id'],
        to: ['bees.id'],
      },
    },
  });
}
