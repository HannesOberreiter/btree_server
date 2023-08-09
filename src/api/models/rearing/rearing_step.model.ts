import { Model } from 'objection';

import { RearingDetail } from './rearing_detail.model.js';
import { RearingType } from './rearing_type.model.js';

export class RearingStep extends Model {
  id!: number;
  type_id!: number;
  detail_id!: number;
  position!: number;
  sleep_after!: number;
  sleep_before!: number;

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
      sleep_after: { type: 'integer', minimum: 0, maximum: 9000 }, // Sleep after in hours
      sleep_before: { type: 'integer', minimum: 0, maximum: 9000 }, // Sleep before in hours
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
