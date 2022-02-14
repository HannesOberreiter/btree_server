import { ExtModel } from '@models/base.model';
import { Hive } from '@models/hive.model';
import { User } from '@models/user.model';
import { CheckupType } from '@models/option/checkup_type.model';
import { CheckupApiary } from '@models//checkup_apiary.model';
export class Checkup extends ExtModel {
  id!: number;
  date!: Date;
  enddate!: Date;

  queen!: number;
  queencells!: number;
  eggs!: number;
  capped_brood!: number;
  brood!: number;
  pollen!: number;
  comb!: number;
  temper!: number;
  calm_comb!: number;
  swarm!: number;
  varroa!: string;
  strong!: number;
  temp!: number;
  weight!: number;
  time!: Date;
  broodframes!: number;
  honeyframes!: number;
  foundation!: number;
  emptyframes!: number;
  note!: string;
  url!: string;
  done!: boolean;
  deleted!: boolean;

  edit_id!: number;

  static tableName = 'checkups';
  static idColumn = 'id';

  type?: CheckupType;
  hive?: Hive;
  checkup_apiary?: CheckupApiary;
  creator?: User;
  editor?: User;

  static jsonSchema = {
    type: 'object',
    required: ['date', 'hive_id'],
    properties: {
      id: { type: 'integer' },
      date: { type: 'string', format: 'date' },
      enddate: { type: 'string', format: 'date' },
      queen: { type: 'boolean' },
      queencells: { type: 'boolean' },
      eggs: { type: 'boolean' },
      capped_brood: { type: 'boolean' },
      brood: { type: 'number' },
      pollen: { type: 'number' },
      comb: { type: 'number' },
      temper: { type: 'number' },
      calm_comb: { type: 'number' },
      swarm: { type: 'number' },
      varroa: { type: 'string', maxLength: 12 },
      strong: { type: 'integer' },
      temp: { type: 'number' },
      weight: { type: 'number' },
      time: { type: 'string', format: 'time' },
      broodframes: { type: 'integer' },
      honeyframes: { type: 'integer' },
      foundation: { type: 'integer' },
      emptyframes: { type: 'integer' },

      note: { type: 'string', maxLength: 2000 },
      url: { type: 'string', maxLength: 512 },

      done: { type: 'boolean' },

      deleted: { type: 'boolean' },
      deleted_at: { type: 'string', format: 'date-time' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },

      type_id: { type: 'integer' }, // Type FK
      user_id: { type: 'integer' }, // Company FK
      bee_id: { type: 'integer' }, // Creator Bee FK
      edit_id: { type: 'integer' } // Updater Bee FK
    }
  };

  static relationMappings = () => ({
    type: {
      relation: ExtModel.HasOneRelation,
      modelClass: CheckupType,
      join: {
        from: ['checkups.type_id'],
        to: ['checkup_types.id']
      }
    },
    hive: {
      relation: ExtModel.HasOneRelation,
      modelClass: Hive,
      join: {
        from: ['checkups.hive_id'],
        to: ['hives.id']
      }
    },
    checkup_apiary: {
      relation: ExtModel.HasOneRelation,
      modelClass: CheckupApiary,
      join: {
        from: ['checkups_apiaries.checkup_id'],
        to: ['checkups.id']
      }
    },
    creator: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['checkups.bee_id'],
        to: ['bees.id']
      }
    },
    editor: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['checkups.edit_id'],
        to: ['bees.id']
      }
    }
  });
}
