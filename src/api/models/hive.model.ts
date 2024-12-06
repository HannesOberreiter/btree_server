import { Apiary } from './apiary.model.js';
import { ExtModel } from './base.model.js';
import { Company } from './company.model.js';
import { HiveLocation } from './hive_location.model.js';
import { Movedate } from './movedate.model.js';
import { HiveSource } from './option/hive_source.model.js';
import { HiveType } from './option/hive_type.mode.js';
import { Queen } from './queen.model.js';
import { QueenLocation } from './queen_location.model.js';
import { User } from './user.model.js';

export class Hive extends ExtModel {
  id!: number;
  name!: string;
  grouphive!: number;
  position!: number;
  note!: string;
  modus!: boolean;
  modus_date!: string;
  deleted_at!: string;
  deleted!: boolean;

  user_id!: number;
  bee_id!: number;
  edit_id!: number;
  type_id!: number;
  source_id!: number;

  static tableName = 'hives';
  static idColumn = 'id';

  creator?: User;
  editor?: User;
  company?: User;
  movedates?: Movedate[];
  apiares?: Apiary[];
  queens?: Queen[];
  hive_location?: HiveLocation;
  hive_type?: HiveType;
  hive_source?: HiveSource;
  queen_location?: QueenLocation;

  static jsonSchema = {
    type: 'object',
    required: ['name'],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', minLength: 1, maxLength: 24 },
      grouphive: { type: 'integer' },
      position: { type: 'integer' },
      note: { type: 'string', maxLength: 2000 },

      modus: { type: 'boolean' },
      modus_date: { type: 'string', format: 'date' },
      deleted: { type: 'boolean' },
      deleted_at: { type: 'string', format: 'iso-date-time' },

      created_at: { type: 'string', format: 'iso-date-time' },
      updated_at: { type: 'string', format: 'iso-date-time' },

      user_id: { type: 'integer' }, // Company FK
      bee_id: { type: 'integer' }, // Creator Bee FK
      edit_id: { type: 'integer' }, // Updater Bee FK

      type_id: { type: 'integer' }, // HiveType FK
      source_id: { type: 'integer' }, // HiveSource FK
    },
  };

  static relationMappings = () => ({
    creator: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['hives.bee_id'],
        to: ['bees.id'],
      },
    },
    editor: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['hives.edit_id'],
        to: ['bees.id'],
      },
    },
    hive_location: {
      relation: Hive.HasOneRelation,
      modelClass: HiveLocation,
      join: {
        from: ['hives.id'],
        to: ['hives_locations.hive_id'],
      },
    },
    queen_location: {
      relation: Hive.HasOneRelation,
      modelClass: QueenLocation,
      join: {
        from: ['hives.id'],
        to: ['queens_locations.hive_id'],
      },
    },
    hive_type: {
      relation: Hive.HasOneRelation,
      modelClass: HiveType,
      join: {
        from: ['hives.type_id'],
        to: ['hive_types.id'],
      },
    },
    hive_source: {
      relation: Hive.HasOneRelation,
      modelClass: HiveSource,
      join: {
        from: ['hives.source_id'],
        to: ['hive_sources.id'],
      },
    },
    movedates: {
      relation: Hive.HasManyRelation,
      modelClass: Movedate,
      join: {
        from: ['hives.id'],
        to: ['movedates.hive_id'],
      },
    },
    queens: {
      relation: Hive.HasManyRelation,
      modelClass: Queen,
      join: {
        from: ['hives.id'],
        to: ['queens.hive_id'],
      },
    },
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['hives.user_id'],
        to: ['companies.id'],
      },
    },
    apiaries: {
      relation: Hive.ManyToManyRelation,
      modelClass: Apiary,
      join: {
        from: 'hives.id',
        through: {
          modelClass: Movedate,
          from: 'movedates.hive_id',
          to: 'movedates.apiary_id',
        },
        to: 'apiaries.id',
      },
    },
  });
}
