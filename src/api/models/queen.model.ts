import { ExtModel } from '@models/base.model';
import { User } from '@models/user.model';
import { Hive } from './hive.model';
import { QueenRace } from './option/queen_race.model';
import { QueenMating } from './option/queen_mating.model';
import { Company } from './company.model';
import { QueenLocation } from './queen_location.model';

export class Queen extends ExtModel {
  id!: number;
  name!: string;
  mark_colour!: number;
  mother!: string;
  date!: Date;
  move_date!: Date;
  note!: string;
  url!: string;

  modus!: boolean;
  modus_date!: Date;
  deleted!: boolean;
  deleted_at!: string;

  bee_id!: number;
  edit_id!: number;
  mother_id!: number;
  user_id!: number;

  static tableName = 'queens';
  static idColumn = 'id';

  creator?: User;
  editor?: User;
  company?: Company;
  hive?: Hive;
  race?: QueenRace[];
  mating?: QueenMating[];
  mothers?: Queen;
  queen_location?: QueenLocation;

  static jsonSchema = {
    type: 'object',
    required: ['name'],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', minLength: 1, maxLength: 24 },
      mark_colour: { type: 'string', maxLength: 24 },
      mother: { type: 'string', maxLength: 24 },
      date: { type: 'string', format: 'date' },
      move_date: { type: 'string', format: 'date' },
      url: { type: 'string', maxLength: 512 },
      note: { type: 'string', maxLength: 2000 },

      modus: { type: 'boolean' },
      modus_date: { type: 'string', format: 'date' },
      deleted: { type: 'boolean' },
      deleted_at: { type: 'string', format: 'date-time' },

      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },

      hive_id: { type: 'integer' },
      race_id: { type: 'integer' },
      mating_id: { type: 'integer' },
      queen_id: { type: 'integer' }, // Self-Join ID
      user_id: { type: 'integer' },
      bee_id: { type: 'integer' }, // Creator Bee FK
      edit_id: { type: 'integer' } // Updater Bee FK
    }
  };

  static relationMappings = () => ({
    creator: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['queens.bee_id'],
        to: ['bees.id']
      }
    },
    editor: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['queens.edit_id'],
        to: ['bees.id']
      }
    },
    hive: {
      relation: Queen.HasOneRelation,
      modelClass: Hive,
      join: {
        from: ['queens.hive_id'],
        to: ['hives.id']
      }
    },
    queen_location: {
      relation: Queen.HasOneRelation,
      modelClass: QueenLocation,
      join: {
        from: ['queens.id'],
        to: ['queens_locations.queen_id']
      }
    },
    race: {
      relation: ExtModel.HasOneRelation,
      modelClass: QueenRace,
      join: {
        from: ['queens.race_id'],
        to: ['queen_races.id']
      }
    },
    mating: {
      relation: ExtModel.HasOneRelation,
      modelClass: QueenMating,
      join: {
        from: ['queens.race_id'],
        to: ['queen_matings.id']
      }
    },
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['queens.user_id'],
        to: ['company.id']
      }
    }
  });
}
