import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchAsiatischeHornisseCh } from '../../src/api/adapters/pest.adapter.js';
import { KyselyServer } from '../../src/servers/kysely.server.js';

const db = KyselyServer.getInstance().db;
const source = 'asiatischehornisse.ch';
const fetchMock = vi.fn<typeof fetch>();

function feature(
  date = '2026-01-02',
  type = 'hornet',
  coordinates = [7.498, 47.444],
) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates },
    properties: {
      observation_id: 990042,
      observation_date: date,
      observation_type: type,
      is_nest_observation: type !== 'hornet',
      is_hornet_observation: type !== 'nest',
      canton: 'BL',
      municipality: 'Dittingen',
      nest_state: type === 'hornet' ? '' : 'active',
    },
  };
}

function feed(features = [feature()]) {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ type: 'FeatureCollection', features })),
  );
}

function requestedUrl() {
  const input = fetchMock.mock.lastCall![0];
  if (!(input instanceof URL)) throw new Error('Expected a URL request');
  return input;
}

describe('Swiss observation synchronization', () => {
  beforeEach(async () => {
    await db
      .deleteFrom('observations')
      .where('external_service', '=', source)
      .execute();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-02T12:00:00Z'));
    feed();
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    await db
      .deleteFrom('observations')
      .where('external_service', '=', source)
      .execute();
  });

  it('bootstraps all years, then limits regular imports and skips unchanged writes', async () => {
    expect(await fetchAsiatischeHornisseCh()).toEqual({
      newObservations: 1,
      updatedObservations: 0,
    });
    expect(requestedUrl().searchParams.has('date_from')).toBe(false);
    feed();
    expect(await fetchAsiatischeHornisseCh()).toEqual({
      newObservations: 0,
      updatedObservations: 0,
    });
    expect(requestedUrl().searchParams.get('date_from')).toBe('2026-01-01');
    expect(requestedUrl().searchParams.get('date_to')).toBe('2026-12-31');
  });

  it.each(['Europe/Vienna', 'America/New_York'])(
    'skips unchanged January 1 imports and applies date corrections in %s',
    async (timezone) => {
      vi.stubEnv('TZ', timezone);
      feed([feature('2025-01-01')]);
      await fetchAsiatischeHornisseCh();
      feed([feature('2025-01-01')]);
      expect(await fetchAsiatischeHornisseCh(true)).toEqual({
        newObservations: 0,
        updatedObservations: 0,
      });
      feed([feature('2026-02-01')]);
      expect(await fetchAsiatischeHornisseCh(true)).toEqual({
        newObservations: 0,
        updatedObservations: 1,
      });
    },
  );

  it('includes the previous year in January and removes that window in February', async () => {
    await fetchAsiatischeHornisseCh();
    vi.setSystemTime(new Date('2027-01-20T12:00:00Z'));
    feed();
    await fetchAsiatischeHornisseCh();
    expect(requestedUrl().searchParams.get('date_from')).toBe('2026-01-01');
    expect(requestedUrl().searchParams.get('date_to')).toBe('2027-12-31');
    vi.setSystemTime(new Date('2027-02-01T12:00:00Z'));
    feed();
    await fetchAsiatischeHornisseCh();
    expect(requestedUrl().searchParams.get('date_from')).toBe('2027-01-01');
  });

  it('updates older corrections during full sync', async () => {
    feed([feature('2024-03-30')]);
    await fetchAsiatischeHornisseCh();
    const before = await db
      .selectFrom('observations')
      .select('id')
      .where('external_service', '=', source)
      .executeTakeFirstOrThrow();
    feed([feature('2025-04-01', 'hornet_and_nest', [8.5, 47.5])]);
    expect(await fetchAsiatischeHornisseCh(true)).toEqual({
      newObservations: 0,
      updatedObservations: 1,
    });
    expect(requestedUrl().searchParams.has('date_from')).toBe(false);
    expect(requestedUrl().searchParams.has('date_to')).toBe(false);
    const after = await db
      .selectFrom('observations')
      .selectAll()
      .where('external_service', '=', source)
      .executeTakeFirstOrThrow();
    expect(after.id).toBe(before.id);
    expect(after.observed_at).toBe('2025-04-01 00:00:00');
    expect(after.location).toEqual({ x: 47.5, y: 8.5 });
    expect(after.data).toMatchObject({ observationType: 'hornet_and_nest' });
  });

  it('does not remove older records absent from a date-filtered response', async () => {
    feed([feature('2024-03-30')]);
    await fetchAsiatischeHornisseCh();
    feed([]);
    expect(await fetchAsiatischeHornisseCh()).toEqual({
      newObservations: 0,
      updatedObservations: 0,
    });
    expect(
      await db
        .selectFrom('observations')
        .select('id')
        .where('external_service', '=', source)
        .execute(),
    ).toHaveLength(1);
  });

  it('recovers after fetch failure and keeps existing records intact', async () => {
    await fetchAsiatischeHornisseCh();
    fetchMock.mockResolvedValue(new Response('', { status: 503 }));
    await expect(fetchAsiatischeHornisseCh(true)).rejects.toThrow('HTTP 503');
    feed();
    expect(await fetchAsiatischeHornisseCh()).toEqual({
      newObservations: 0,
      updatedObservations: 0,
    });
  });

  it('serializes overlapping regular and monthly imports', async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response(
          JSON.stringify({ type: 'FeatureCollection', features: [feature()] }),
        ),
    );
    const results = await Promise.all([
      fetchAsiatischeHornisseCh(),
      fetchAsiatischeHornisseCh(true),
    ]);
    expect(results).toEqual([
      { newObservations: 1, updatedObservations: 0 },
      { newObservations: 0, updatedObservations: 0 },
    ]);
    expect(requestedUrl().searchParams.has('date_from')).toBe(false);
  });
});
