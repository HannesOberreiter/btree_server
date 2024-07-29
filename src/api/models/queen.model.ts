import { ExtModel } from './base.model.js';
import { User } from './user.model.js';
import { QueenRace } from './option/queen_race.model.js';
import { QueenMating } from './option/queen_mating.model.js';
import { Company } from './company.model.js';
import { QueenLocation } from './queen_location.model.js';
import { HiveLocation } from './hive_location.model.js';

export class Queen extends ExtModel {
  id!: number;
  name!: string;
  mark_colour!: number;
  mother!: string;
  date!: string;
  move_date!: string;
  note!: string;
  url!: string;

  modus!: boolean;
  modus_date!: string;
  deleted!: boolean;
  deleted_at!: string;

  bee_id!: number;
  edit_id!: number;
  mother_id!: number;
  user_id!: number;
  hive_id!: number;
  race_id!: number;
  mating_id!: number;

  static tableName = 'queens';
  static idColumn = 'id';

  creator?: User;
  editor?: User;
  company?: Company;
  hive_location?: HiveLocation;
  race?: QueenRace;
  mating?: QueenMating;
  own_mother?: Queen;
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
      deleted_at: { type: 'string', format: 'iso-date-time' },

      created_at: { type: 'string', format: 'iso-date-time' },
      updated_at: { type: 'string', format: 'iso-date-time' },

      hive_id: { type: ['integer', 'null'] },
      race_id: { type: 'integer' },
      mating_id: { type: 'integer' },
      mother_id: { type: ['integer', 'null'] }, // Self-Join ID
      user_id: { type: 'integer' },
      bee_id: { type: 'integer' }, // Creator Bee FK
      edit_id: { type: 'integer' }, // Updater Bee FK
    },
  };

  static relationMappings = () => ({
    creator: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['queens.bee_id'],
        to: ['bees.id'],
      },
    },
    editor: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['queens.edit_id'],
        to: ['bees.id'],
      },
    },
    hive_location: {
      relation: Queen.HasOneRelation,
      modelClass: HiveLocation,
      join: {
        from: ['queens.hive_id'],
        to: ['hives_locations.hive_id'],
      },
    },
    queen_location: {
      relation: Queen.HasOneRelation,
      modelClass: QueenLocation,
      join: {
        from: ['queens.id'],
        to: ['queens_locations.queen_id'],
      },
    },
    race: {
      relation: ExtModel.HasOneRelation,
      modelClass: QueenRace,
      join: {
        from: ['queens.race_id'],
        to: ['queen_races.id'],
      },
    },
    mating: {
      relation: ExtModel.HasOneRelation,
      modelClass: QueenMating,
      join: {
        from: ['queens.mating_id'],
        to: ['queen_matings.id'],
      },
    },
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['queens.user_id'],
        to: ['companies.id'],
      },
    },
    own_mother: {
      relation: ExtModel.HasOneRelation,
      modelClass: Queen,
      join: {
        from: ['queens.mother_id'],
        to: ['queens.id'],
      },
    },
  });
}
