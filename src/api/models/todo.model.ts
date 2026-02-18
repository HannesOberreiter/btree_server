import { ExtModel } from './base.model.js';
import { Apiary } from './apiary.model.js';
import { Company } from './company.model.js';
import { User } from './user.model.js';

export class Todo extends ExtModel {
  id!: number;
  name!: string;
  date!: Date;
  note!: string;
  url!: string;
  done!: boolean;
  edit_id!: number;
  bee_id!: number;
  user_id!: number;
  apiary_id!: number;

  static tableName = 'todos';
  static idColumn = 'id';

  company?: Company;
  creator?: User;
  editor?: User;
  apiary?: Apiary;

  static jsonSchema = {
    type: 'object',
    required: ['date', 'name'],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', maxLength: 48 },
      date: { type: 'string', format: 'date' },
      note: { type: 'string', maxLength: 2000 },
      url: { type: 'string', maxLength: 512 },

      done: { type: 'boolean' },

      created_at: { type: 'string', format: 'iso-date-time' },
      updated_at: { type: 'string', format: 'iso-date-time' },

      user_id: { type: 'integer' }, // Company FK
      bee_id: { type: 'integer' }, // Creator Bee FK
      edit_id: { type: 'integer' }, // Updater Bee FK
      apiary_id: { type: 'integer' }, // Apiary FK
    },
  };

  static relationMappings = () => ({
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['todos.user_id'],
        to: ['company.id'],
      },
    },
    creator: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['todos.bee_id'],
        to: ['bees.id'],
      },
    },
    editor: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['todos.edit_id'],
        to: ['bees.id'],
      },
    },
    apiary: {
      relation: ExtModel.HasOneRelation,
      modelClass: Apiary,
      join: {
        from: ['todos.apiary_id'],
        to: ['apiaries.id'],
      },
    },
  });
}
