import { describe, expect, it } from 'vitest';

import { parseFrelonasiatiqueObservations } from '../../src/api/adapters/frelonasiatique.parser.js';

function feature(
  id: number,
  observationType: 'hornet' | 'nest' | 'hornet_and_nest' = 'hornet',
) {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [7.498, 47.444],
    },
    properties: {
      observation_id: id,
      observation_date: '2026-09-01',
      observation_type: observationType,
      observed_at_hive: false,
      is_nest_observation: observationType !== 'hornet',
      is_hornet_observation: observationType !== 'nest',
      is_parent_nest: false,
      canton: 'BL',
      municipality: 'Dittingen',
      nest_state: observationType === 'hornet' ? '' : 'active',
    },
  };
}

describe('frelonasiatique.ch observation parser', () => {
  it('maps public GeoJSON observations to b.tree records', () => {
    const observations = parseFrelonasiatiqueObservations({
      type: 'FeatureCollection',
      features: [feature(42, 'hornet_and_nest')],
    });

    expect(observations).toEqual([
      {
        externalId: 42,
        observedAt: '2026-09-01T00:00:00.000Z',
        location: { lat: 47.444, lng: 7.498 },
        observationType: 'hornet_and_nest',
        canton: 'BL',
        municipality: 'Dittingen',
        nestState: 'active',
      },
    ]);
  });

  it('rejects malformed observations instead of partially importing them', () => {
    const malformed = feature(42);
    malformed.geometry.coordinates = [181, 47.444];

    expect(() =>
      parseFrelonasiatiqueObservations({
        type: 'FeatureCollection',
        features: [feature(41), malformed],
      }),
    ).toThrow('Invalid frelonasiatique.ch observation at index 1');
  });

  it('rejects duplicate source IDs', () => {
    expect(() =>
      parseFrelonasiatiqueObservations({
        type: 'FeatureCollection',
        features: [feature(42), feature(42)],
      }),
    ).toThrow('Duplicate frelonasiatique.ch observation ID 42');
  });
});
