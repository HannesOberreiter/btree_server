import { Company } from '@models/company.model';
import { RearingDetail } from './rearing_detail.model';
import { RearingType } from './rearing_type.model';
import { ExtModel } from '../base.model';

export class Rearing extends ExtModel {
  id!: number;
  larvae!: number;
  hatch!: number;
  note!: string;
  date!: Date;
  type_id!: number;
  detail_id!: number;
  user_id!: number;
  edit_id!: number;

  company?: Company;
  start?: RearingDetail;
  type?: RearingType;

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
      larvae: { type: 'integer' },
      hatch: { type: 'integer' },

      date: { type: 'string', format: 'date-time' },
      note: { type: 'string', maxLength: 2000 },
      type_id: { type: 'integer' },
      detail_id: { type: 'integer' },
      user_id: { type: 'integer' }
    }
  };

  static relationMappings = () => ({
    company: {
      relation: Rearing.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['rearings.user_id'],
        to: ['company.id']
      }
    },
    start: {
      relation: Rearing.HasOneRelation,
      modelClass: RearingDetail,
      join: {
        from: ['rearings.detail_id'],
        to: ['rearing_details.id']
      }
    },
    type: {
      relation: Rearing.HasOneRelation,
      modelClass: RearingType,
      join: {
        from: ['rearings.type_id'],
        to: ['rearing_types.id']
      }
    }
  });
}
