import { Model } from 'objection';

import { Company } from '../company.model.js';
import { RearingType } from './rearing_type.model.js';
import { RearingStep } from './rearing_step.model.js';

export class RearingDetail extends Model {
  id!: number;
  job!: string;
  /**
   * @deprecated use sleep_before in rearing_steps table
   */
  hour!: string;
  note!: string;
  user_id!: number;

  company?: Company;
  type?: RearingType[];
  step?: RearingStep[];

  constructor() {
    super();
  }

  static get modifiers() {
    return {
      orderByPosition(builder) {
        builder.orderBy('rearing_steps.position', 'asc');
      },
    };
  }

  static tableName = 'rearing_details';
  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    required: ['job'],
    properties: {
      id: { type: 'integer' },
      job: { type: 'string', minLength: 1, maxLength: 50 },
      hour: { type: 'integer' }, // deprecated, use sleep_before in rearing_steps table
      note: { type: 'string', maxLength: 2000 },
      user_id: { type: 'integer' }, // Company FK
    },
  };

  static relationMappings = () => ({
    company: {
      relation: RearingDetail.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['rearing_details.user_id'],
        to: ['companies.id'],
      },
    },
    step: {
      relation: RearingDetail.HasManyRelation,
      modelClass: RearingStep,
      join: {
        from: ['rearing_details.id'],
        to: ['rearing_steps.detail_id'],
      },
    },
    type: {
      relation: RearingDetail.ManyToManyRelation,
      modelClass: RearingType,
      join: {
        from: 'rearing_details.id',
        through: {
          modelClass: RearingStep,
          from: 'rearing_steps.detail_id',
          to: 'rearing_steps.type_id',
        },
        to: 'rearing_types.id',
      },
    },
  });
}
