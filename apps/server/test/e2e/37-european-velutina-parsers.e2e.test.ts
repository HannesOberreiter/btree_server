import { readFileSync } from 'node:fs';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  parseStopVelutinaDetailDate,
  parseStopVelutinaMarkers,
} from '../../src/api/adapters/stopvelutina.parser.js';
import { parseStopVespaPage } from '../../src/api/adapters/stopvespa.parser.js';
import confirmed from '../fixtures/stopvespa-confirmed.json';

const mapHtml = readFileSync(
  new URL('../fixtures/stopvelutina-map.html', import.meta.url),
  'utf8',
);
const detailHtml = readFileSync(
  new URL('../fixtures/stopvelutina-detail.html', import.meta.url),
  'utf8',
);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-14T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());

describe('Stop Velutina parsing', () => {
  it('reads literal nest/hornet markers, excludes orientalis, and reads genuine detail dates', () => {
    const result = parseStopVelutinaMarkers(mapHtml);
    expect(result.skippedRecords).toBe(1);
    expect(
      result.records.map((record) => [
        record.externalId,
        record.observationType,
      ]),
    ).toEqual([
      [110, 'nest'],
      [9120, 'hornet'],
    ]);
    expect(result.records[0].location).toEqual({
      lat: 43.96331049908523,
      lng: 10.180362963982414,
    });
    expect(parseStopVelutinaDetailDate(detailHtml, 2023)).toBe(
      '2023-07-04T00:00:00.000Z',
    );
  });

  it.each([
    'lsmk(91, 10, 1, 23, 1)',
    'lsmk(43, -181, 1, 23, 1)',
    'lsmk(43, 10, -1, 23, 1)',
    'lsmk(43, 10, 1.5, 23, 1)',
    'lsmk(43, 10, 9007199254740992, 23, 1)',
    'lsmk(43, 10, 1, 23, 4)',
    'lsmk(43, 10, 1, 99, 1)',
    'lsmk(0, 0, 1, 23, 1)',
    'lsmk(43, 10, evil, 23, 1)',
  ])('counts invalid markers: %s', (html) => {
    expect(parseStopVelutinaMarkers(html)).toEqual({
      records: [],
      skippedRecords: 1,
    });
  });

  it.each([
    ['Data: 31/02/2023', 2023],
    ['Data: 04/07/2024', 2023],
    ['Data: 15/09/2026', 2026],
    ['Anno: 2023', 2023],
    ['<script>Data: 04/07/2023</script>', 2023],
    ['Data: 04/07/2023 Data: 05/07/2023', 2023],
  ])('does not fabricate dates: %s', (html, year) => {
    expect(parseStopVelutinaDetailDate(html, year)).toBeUndefined();
  });

  it('never executes scripts and fails closed on broken maps/conflicting IDs', () => {
    expect(
      parseStopVelutinaMarkers(
        `${mapHtml}<script>throw new Error('executed')</script>`,
      ).records,
    ).toHaveLength(2);
    expect(() => parseStopVelutinaMarkers('<html>Maintenance</html>')).toThrow(
      'no marker calls',
    );
    expect(() =>
      parseStopVelutinaMarkers(
        'lsmk(43, 10, 1, 23, 1); lsmk(44, 10, 1, 23, 1)',
      ),
    ).toThrow('Conflicting');
  });
});

describe('STOPvespa parsing', () => {
  it('normalizes UUIDs, preserves observation time, swaps ArcGIS coordinates and allowlists metadata', () => {
    const payload = structuredClone(confirmed);
    Object.assign(payload.features[0].attributes, {
      globalid: '{469FA0AD-2966-4804-8BCD-E63A16DDD075}',
      email: 'private@example.invalid',
      notes: '<script>bad</script>',
      EditDate: 123,
    });
    expect(parseStopVespaPage(payload).records).toEqual([
      {
        externalUuid: '469fa0ad-2966-4804-8bcd-e63a16ddd075',
        observedAt: '2026-09-13T11:00:00.000Z',
        location: { lat: 41.595138, lng: -8.422755 },
        data: {
          observationType: 'nest',
          nestType: 'definitivo',
          destroyed: true,
          destroyedAt: '2026-09-13T11:00:00.000Z',
          uri: 'https://stopvespa.icnf.pt/geovisualizador/',
        },
      },
    ]);
  });

  it('keeps unknown status distinct from not destroyed, supports hornets and primary nests', () => {
    const payload = structuredClone(confirmed);
    Object.assign(payload.features[0].attributes, {
      tipo_observ: 'vespa',
      tipo: null,
      exterminad: null,
      data_exter: null,
    });
    expect(parseStopVespaPage(payload).records[0].data).toMatchObject({
      observationType: 'hornet',
      nestType: null,
      destroyed: null,
      destroyedAt: null,
    });
    Object.assign(payload.features[0].attributes, {
      tipo_observ: 'ninho',
      tipo: 'primário',
      exterminad: 'não',
    });
    expect(parseStopVespaPage(payload).records[0].data).toMatchObject({
      observationType: 'nest',
      nestType: 'primário',
      destroyed: false,
    });
  });

  it.each([
    { globalid: null },
    { globalid: '195497' },
    { globalid: '00000000-0000-0000-0000-000000000000' },
    { data_observ: null },
    { data_observ: -55780744995000 },
    { data_observ: 4702017600000 },
    { data_observ: '2026-09-13' },
    { tipo_observ: 'suspeita' },
    { tipo: 'unknown' },
    { exterminad: 'unknown' },
    { data_exter: 4702017600000 },
    { data_exter: 1 },
  ])(
    'skips invalid attributes without using registration/edit dates: %j',
    (attributes) => {
      const payload = structuredClone(confirmed);
      Object.assign(payload.features[0].attributes, attributes, {
        data_regis: 1789297200000,
        EditDate: 1789297200000,
      });
      expect(parseStopVespaPage(payload)).toMatchObject({
        records: [],
        skippedRecords: 1,
      });
    },
  );

  it.each([
    null,
    { x: 0, y: 0 },
    { x: 181, y: 41 },
    { x: -8, y: 91 },
    { x: '-8', y: 41 },
  ])('skips invalid points: %j', (geometry) => {
    const feature = { ...confirmed.features[0], geometry };
    expect(
      parseStopVespaPage({ ...confirmed, features: [feature] }).skippedRecords,
    ).toBe(1);
  });

  it.each([
    null,
    {},
    { error: { code: 400 } },
    { ...confirmed, features: null },
    { ...confirmed, geometryType: 'esriGeometryPolygon' },
    { ...confirmed, spatialReference: { wkid: 3857 } },
    { ...confirmed, exceededTransferLimit: 'true' },
    { ...confirmed, features: [{ attributes: {} }] },
    { ...confirmed, features: [null] },
  ])(
    'rejects broken payloads rather than silently treating them as empty: %j',
    (payload) => {
      expect(() => parseStopVespaPage(payload)).toThrow();
    },
  );
});
