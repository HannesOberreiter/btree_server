import { Model } from 'objection';
import { Company } from '@models/company.model';
import { RearingDetail } from './rearing_detail.model';
import { RearingStep } from './rearing_step.model';

export class RearingType extends Model {
  id!: number;
  name!: string;
  note!: string;
  user_id!: number;

  company?: Company;
  detail?: RearingDetail[];
  step?: RearingStep[];

  constructor() {
    super();
  }

  static tableName = 'rearing_types';
  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    required: ['name'],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', minLength: 1, maxLength: 45 },
      note: { type: 'string', maxLength: 2000 },
      user_id: { type: 'integer' }, // Company FK
    },
  };

  static relationMappings = () => ({
    company: {
      relation: RearingType.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['rearing_types.user_id'],
        to: ['companies.id'],
      },
    },

    step: {
      relation: RearingType.HasManyRelation,
      modelClass: RearingStep,
      join: {
        from: ['rearing_types.id'],
        to: ['rearing_steps.type_id'],
      },
    },

    detail: {
      relation: RearingType.ManyToManyRelation,
      modelClass: RearingDetail,
      join: {
        from: 'rearing_types.id',
        through: {
          modelClass: RearingStep,
          from: 'rearing_steps.type_id',
          to: 'rearing_steps.detail_id',
        },
        to: 'rearing_details.id',
      },
    },
  });
}
