import { ExtModel } from './base.model.js';
import { Company } from './company.model.js';
import { ChargeType } from './option/charge_type.model.js';
import { User } from './user.model.js';

export class Charge extends ExtModel {
  id!: number;
  name!: string;
  charge!: string;
  bestbefore!: string;
  calibrate!: string;
  amount!: number;
  price!: number;
  note!: string;
  url!: string;
  kind!: string;
  deleted!: boolean;
  deleted_at!: string;
  user_id!: number;

  edit_id!: number;
  bee_id!: number;
  type_id!: number;

  static tableName = 'charges';
  static idColumn = 'id';

  type?: ChargeType;
  company?: Company;
  creator?: User;
  editor?: User;

  static jsonSchema = {
    type: 'object',
    required: ['kind'],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', maxLength: 255 },
      charge: { type: 'string', maxLength: 255 },
      bestbefore: { type: 'string', format: 'date' },
      calibrate: { type: 'string', maxLength: 45 },
      amount: { type: 'number' },
      price: { type: 'number' },
      note: { type: 'string', maxLength: 2000 },
      url: { type: 'string', maxLength: 512 },
      kind: { type: 'string', maxLength: 45, enum: ['in', 'out'] },

      deleted: { type: 'boolean' },
      deleted_at: { type: 'string', format: 'iso-date-time' },
      created_at: { type: 'string', format: 'iso-date-time' },
      updated_at: { type: 'string', format: 'iso-date-time' },

      type_id: { type: 'integer' }, // Type FK
      user_id: { type: 'integer' }, // Company FK
      bee_id: { type: 'integer' }, // Creator Bee FK
      edit_id: { type: 'integer' }, // Updater Bee FK
    },
  };

  static relationMappings = () => ({
    type: {
      relation: ExtModel.HasOneRelation,
      modelClass: ChargeType,
      join: {
        from: ['charges.type_id'],
        to: ['charge_types.id'],
      },
    },
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['charges.user_id'],
        to: ['company.id'],
      },
    },
    creator: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['charges.bee_id'],
        to: ['bees.id'],
      },
    },
    editor: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['charges.edit_id'],
        to: ['bees.id'],
      },
    },
  });
}
