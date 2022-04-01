import { ExtModel } from '@models/base.model';
import { User } from '@models/user.model';
import { Apiary } from '@models/apiary.model';
import { Movedate } from '@models/movedate.model';
import { HiveLocation } from './hive_location.model';
import { HiveType } from './option/hive_type.mode';
import { HiveSource } from './option/hive_source.model';
export class Hive extends ExtModel {
  id!: number;
  name!: string;
  grouphive!: number;
  position!: number;
  note!: string;
  url!: string;
  modus!: boolean;
  modus_date!: Date;
  deleted!: boolean;

  bee_id!: number;
  edit_id!: number;

  static tableName = 'hives';
  static idColumn = 'id';

  creator?: User;
  editor?: User;
  movedates?: Movedate[];
  apiares?: Apiary[];
  hive_location?: HiveLocation;
  hive_type?: HiveType;
  hive_source?: HiveSource;

  static jsonSchema = {
    type: 'object',
    required: ['name'],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', minLength: 1, maxLength: 45 },
      grouphive: { type: 'integer' },
      position: { type: 'integer' },
      note: { type: 'string', maxLength: 2000 },

      modus: { type: 'boolean' },
      modus_date: { type: 'string', format: 'date' },
      deleted: { type: 'boolean' },
      deleted_at: { type: 'string', format: 'date-time' },

      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },

      bee_id: { type: 'integer' }, // Creator Bee FK
      edit_id: { type: 'integer' } // Updater Bee FK
    }
  };

  static relationMappings = () => ({
    creator: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['hives.bee_id'],
        to: ['bees.id']
      }
    },
    editor: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['hives.edit_id'],
        to: ['bees.id']
      }
    },
    hive_location: {
      relation: Hive.HasOneRelation,
      modelClass: HiveLocation,
      join: {
        from: ['hives.id'],
        to: ['hives_locations.hive_id']
      }
    },
    hive_type: {
      relation: Hive.HasOneRelation,
      modelClass: HiveType,
      join: {
        from: ['hives.type_id'],
        to: ['hive_types.id']
      }
    },
    hive_source: {
      relation: Hive.HasOneRelation,
      modelClass: HiveSource,
      join: {
        from: ['hives.source_id'],
        to: ['hive_sources.id']
      }
    },
    movedates: {
      relation: Hive.HasManyRelation,
      modelClass: Movedate,
      join: {
        from: ['hives.id'],
        to: ['movedates.hive_id']
      }
    },
    apiaries: {
      relation: Hive.ManyToManyRelation,
      modelClass: Apiary,
      join: {
        from: 'hives.id',
        through: {
          modelClass: Movedate,
          from: 'movedates.hive_id',
          to: 'movedates.apiary_id'
        },
        to: 'apiaries.id'
      }
    }
  });
}
