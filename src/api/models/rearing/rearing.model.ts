import { ExtModel } from '../base.model.js';
import { Company } from '../company.model.js';
import { RearingDetail } from './rearing_detail.model.js';
import { RearingStep } from './rearing_step.model.js';
import { RearingType } from './rearing_type.model.js';

export class Rearing extends ExtModel {
  id!: number;
  name!: string;
  symbol!: string;
  larvae!: number;
  hatch!: number;
  mated!: number;
  note!: string;
  date!: Date;
  type_id!: number;
  detail_id!: number;
  user_id!: number;
  edit_id!: number;
  bee_id!: number;

  company?: Company;
  start?: RearingDetail;
  type?: RearingType;
  step?: RearingStep;

  constructor() {
    super();
  }

  static tableName = 'rearings';
  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    required: [],
    properties: {
      id: { type: 'integer' },

      name: { type: 'string', maxLength: 24 },
      symbol: { type: 'string', maxLength: 24 },

      larvae: { type: 'integer' },
      hatch: { type: 'integer' },
      mated: { type: 'integer' },

      date: { type: 'string', format: 'iso-date-time' },
      note: { type: 'string', maxLength: 2000 },
      type_id: { type: 'integer' },
      detail_id: { type: 'integer' },
      user_id: { type: 'integer' },
    },
  };

  static relationMappings = () => ({
    company: {
      relation: Rearing.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['rearings.user_id'],
        to: ['companies.id'],
      },
    },
    start: {
      relation: Rearing.HasOneRelation,
      modelClass: RearingDetail,
      join: {
        from: ['rearings.detail_id'],
        to: ['rearing_details.id'],
      },
    },
    type: {
      relation: Rearing.HasOneRelation,
      modelClass: RearingType,
      join: {
        from: ['rearings.type_id'],
        to: ['rearing_types.id'],
      },
    },
    step: {
      relation: Rearing.HasManyRelation,
      modelClass: RearingStep,
      join: {
        from: ['rearings.type_id'],
        to: ['rearing_steps.type_id'],
      },
    },
  });
}
