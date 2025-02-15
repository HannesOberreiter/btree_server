import { BaseModel } from './base.model.js';
import { Scale } from './scale.model.js';

export class ScaleData extends BaseModel {
  id!: number;
  datetime!: string;
  weight: number;
  temp1: number;
  temp2: number;
  rain: number;
  humidity: number;
  note: string;

  scale_id!: number;

  scale?: Scale;

  static tableName = 'scale_data';
  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    required: ['scale_id', 'datetime'],
    properties: {
      datetime: { type: 'string', format: 'iso-date-time' },
      weight: { type: 'number' },
      temp1: { type: 'number' },
      temp2: { type: 'number' },
      rain: { type: 'number' },
      humidity: { type: 'number' },
      note: { type: 'string', maxLength: 300 },
      scale_id: { type: 'integer' },
    },
  };

  static relationMappings = () => ({
    scale: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: Scale,
      join: {
        from: 'scale_data.scale_id',
        to: 'scales.id',
      },
    },
  });
}
