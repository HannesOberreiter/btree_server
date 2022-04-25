import { Model } from 'objection';
import { RearingDetail } from '@models/rearing/rearing_detail.model';
import { RearingType } from './rearing_type.model';

export class RearingStep extends Model {
  id!: number;
  type_id!: number;
  detail_id!: number;
  position!: number;

  type?: RearingType;
  detail?: RearingDetail;

  static tableName = 'rearing_steps';
  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    required: ['position'],
    properties: {
      id: { type: 'integer' },
      type_id: { type: 'integer' }, // RearingType FK
      detail_id: { type: 'integer' }, // RearingDetail FK
      position: { type: 'integer' }, // Order of Rearing Steps for Rearing
    },
  };

  static get modifiers() {
    return {
      orderByPosition(builder) {
        builder.orderBy('position', 'asc');
      },
    };
  }

  static relationMappings = () => ({
    detail: {
      relation: RearingStep.BelongsToOneRelation,
      modelClass: RearingDetail,
      join: {
        from: 'rearing_steps.detail_id',
        to: 'rearing_details.id',
      },
    },
    type: {
      relation: RearingStep.BelongsToOneRelation,
      modelClass: RearingType,
      join: {
        from: 'rearing_steps.type_id',
        to: 'rearing_types.id',
      },
    },
  });
}
