import { BaseModel } from '@models/base.model';
import { User } from '@models/user.model';
import { Company } from '@models/company.model';

export class Apiary extends BaseModel {

  id!: number;
  name!: string;
  description!: string;
  latitude!: number;
  longitude!: number;
  note!: string;
  url!: string;
  modus!: boolean;
  deleted!: boolean;
  
  static tableName = "apiaries";
  static idColumn = "id";

  company?: Company
  creator?: User
  editor?: User

  static jsonSchema = {
    type: 'object',
    required: ['name'],
    properties: {
      id:          { type: 'integer' },
      name:        { type: 'string', minLength: 1, maxLength: 45 },
      description: { type: 'string', maxLength: 512 },
      latitude:    { type: 'number', minimum: -90, maximum: 90 },
      longitude:   { type: 'number', minimum: -90, maximum: 90 },
      note:        { type: 'string', maxLength: 2000 },
      url:         { type: 'string', maxLength: 512 },

      modus:       { type: 'boolean' },
      deleted:     { type: 'boolean' },
      deleted_at:  { type: 'date-time' },

      created_at:  { type: 'date-time' },
      updated_at:  { type: 'date-time' },

      user_id: { type: 'integer' }, // Company FK
      bee_id:  { type: 'integer' }, // Creator Bee FK
      edit_id: { type: 'integer' }, // Updater Bee FK
    }
  };

  static relationMappings = () => ({
    company: {
        relation: BaseModel.HasOneRelation,
        modelClass: Company,
        join: {
            from: ['aparies.user_id'],
            to: ['company.id']
        }
    },
    creator: {
        relation: BaseModel.HasOneRelation,
        modelClass: User,
        join: {
            from: ['aparies.bee_id'],
            to: ['bees.id']
        }
    },
    editor: {
        relation: BaseModel.HasOneRelation,
        modelClass: User,
        join: {
            from: ['aparies.edit_id'],
            to: ['bees.id']
        }
    },

  });

}