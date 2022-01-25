import { ExtModel } from '@models/base.model';
import { Company } from '@models/company.model';
import { User } from '@models/user.model';
import { ChargeType } from '@/api/models/option/charge_type.model';

export class Charge extends ExtModel {
  id!: number;
  bez!: string;
  charge!: string;
  bestbefore!: Date;
  calibrate!: string;
  amount!: number;
  price!: number;
  unit!: string;
  note!: string;
  url!: string;
  kind!: string;
  deleted!: boolean;

  static tableName = 'charges';
  static idColumn = 'id';

  charge_types?: ChargeType;
  company?: Company;
  creator?: User;
  editor?: User;

  static jsonSchema = {
    type: 'object',
    required: ['kind'],
    properties: {
      id: { type: 'integer' },
      bez: { type: 'string', maxLength: 255 },
      charge: { type: 'string', maxLength: 255 },
      bestbefore: { type: 'string', format: 'date' },
      calibrate: { type: 'string', maxLength: 45 },
      amount: { type: 'number' },
      price: { type: 'number' },
      unit: { type: 'string' },
      note: { type: 'string', maxLength: 2000 },
      url: { type: 'string', maxLength: 512 },
      kind: { type: 'string', maxLength: 45 },

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
    charge_types: {
      relation: ExtModel.HasOneRelation,
      modelClass: ChargeType,
      join: {
        from: ['charges.type_id'],
        to: ['charge_types.id']
      }
    },
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['charges.user_id'],
        to: ['company.id']
      }
    },
    creator: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['charges.bee_id'],
        to: ['bees.id']
      }
    },
    editor: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['charges.edit_id'],
        to: ['bees.id']
      }
    }
  });
}
