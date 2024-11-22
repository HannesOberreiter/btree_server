import { raw } from 'objection';
import { z } from 'zod';
import { ExtModel } from './base.model.js';

export const Taxa = z.union([
  z.literal('Vespa velutina'),
  z.literal('Aethina tumida'),
]);
export type Taxa = z.infer<typeof Taxa>;

export class Observation extends ExtModel {
  id!: number;
  taxa!: Taxa;
  external_service!: 'iNaturalist' | 'PatriNat';
  external_id!: number;
  external_uuid!: string;
  location!: {
    lat: number
    lng: number
  };

  data!: any;

  observed_at!: string;

  static tableName = 'observations';
  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    required: ['taxa', 'external_service', 'location', 'observed_at'],
    properties: {
      id: { type: 'integer' },
      taxa: { type: 'string', minLength: 1, maxLength: 45 },
      external_service: { type: 'string', minLength: 1, maxLength: 45 },
      external_id: { type: 'integer' },
      external_uuid: { type: 'string' },
      location: { type: 'object' },
      data: { type: 'object' },

      observed_at: { type: 'string', format: 'iso-date-time' },
      created_at: { type: 'string', format: 'iso-date-time' },
      updated_at: { type: 'string', format: 'iso-date-time' },
    },
  };

  $formatDatabaseJson(json) {
    const location = json.location;
    const formattedJson = super.$formatDatabaseJson(json);
    const rawLocation = raw('PointFromText("POINT(? ?)")', [
      location.lat,
      location.lng,
    ]);
    formattedJson.location = rawLocation;
    return formattedJson;
  }
}
