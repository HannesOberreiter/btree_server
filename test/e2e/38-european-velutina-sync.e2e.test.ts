import { readFileSync } from 'node:fs';

import Fastify from 'fastify';
import { serializerCompiler } from 'fastify-type-provider-zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createClient } from 'redis';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchObservations } from '../../src/api/adapters/pest.adapter.js';
import { fetchStopVelutina } from '../../src/api/adapters/stopvelutina.adapter.js';
import { fetchStopVespa } from '../../src/api/adapters/stopvespa.adapter.js';
import * as observationModule from '../../src/api/modules/observation.module.js';
import {
  insertObservations,
  listObservationsByYear,
  listRecentObservations,
  recentObservationsCacheKey,
  yearlyObservationsCacheKey,
} from '../../src/api/modules/observation.module.js';
import { publicObservationListResponseSchema } from '../../src/api/schemas/public.schema.js';
import { KyselyServer } from '../../src/servers/kysely.server.js';
import { RedisServer } from '../../src/servers/redis.server.js';
import confirmed from '../fixtures/stopvespa-confirmed.json';

const db = KyselyServer.getInstance().db;
const sources = ['stopvelutina.it', 'stopvespa.icnf.pt', 'european-sync-test'];
const fetchMock = vi.fn<typeof fetch>();
const redisClient = createClient();
const originalRedisClient = RedisServer.client;
const mapHtml = readFileSync(
  new URL('../fixtures/stopvelutina-map.html', import.meta.url),
  'utf8',
);
const detailHtml = readFileSync(
  new URL('../fixtures/stopvelutina-detail.html', import.meta.url),
  'utf8',
);

function json(payload: unknown) {
  return new Response(JSON.stringify(payload));
}
function urlOf(input: Parameters<typeof fetch>[0]) {
  return new URL(input instanceof Request ? input.url : String(input));
}
function rows(source: string) {
  return db
    .selectFrom('observations')
    .selectAll()
    .where('external_service', '=', source)
    .execute();
}
function italyFeed() {
  fetchMock.mockImplementation(async (input) => {
    const url = urlOf(input);
    if (url.pathname.includes('embedded')) return new Response(mapHtml);
    return new Response(
      url.searchParams.get('id') === 'c_infobox_110'
        ? detailHtml
        : 'Individuo di: Vespa velutina<br>Data: 14/09/2026',
    );
  });
}
function portugalFeed(payload = confirmed) {
  fetchMock.mockImplementation(async () => json(payload));
}

beforeEach(async () => {
  await db
    .deleteFrom('observations')
    .where('external_service', 'in', sources)
    .execute();
  RedisServer.client = redisClient;
  vi.spyOn(redisClient, 'del').mockResolvedValue(1);
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-14T12:00:00Z'));
});
afterEach(async () => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  RedisServer.client = originalRedisClient;
  await db
    .deleteFrom('observations')
    .where('external_service', 'in', sources)
    .execute();
});

describe('Stop Velutina synchronization', () => {
  it('inserts source-scoped dated markers, exposes the public contract and skips known details', async () => {
    await insertObservations(db, [
      {
        external_id: 110,
        external_service: sources[2],
        observed_at: '2023-07-04',
        location: { lat: 43, lng: 10 },
        taxa: 'Vespa velutina',
      },
    ]);
    italyFeed();
    expect(await fetchStopVelutina()).toEqual({
      newObservations: 2,
      skippedRecords: 1,
    });
    const inserted = await rows(sources[0]);
    expect(inserted).toHaveLength(2);
    expect(inserted.find((row) => row.external_id === 110)?.data).toEqual({
      observationType: 'nest',
      uri: 'https://www.stopvelutina.it/dove/',
      detailUri:
        'https://www.beewatching.it/lsbox/ajaxGetInfoboxMappaStopVelutina.php?id=c_infobox_110&single=0',
    });
    const old = (await listObservationsByYear(db, 'Vespa velutina', 2023)).find(
      (row) => row.observation_type === 'nest',
    );
    expect(old?.location).toEqual({
      x: 43.96331049908523,
      y: 10.180362963982414,
    });
    expect(new Date(old!.observed_at).toISOString()).toBe(
      '2023-07-04T00:00:00.000Z',
    );
    expect(JSON.parse(old!.uri)).toBe('https://www.stopvelutina.it/dove/');
    expect(
      (await listRecentObservations(db, 'Vespa velutina')).some(
        (row) => row.observation_type === 'hornet',
      ),
    ).toBe(true);
    expect(redisClient.del).toHaveBeenCalledWith(
      expect.arrayContaining([
        recentObservationsCacheKey('Vespa velutina'),
        yearlyObservationsCacheKey('Vespa velutina', 2023),
        yearlyObservationsCacheKey('Vespa velutina', 2026),
      ]),
    );
    fetchMock.mockClear();
    expect(await fetchStopVelutina()).toEqual({
      newObservations: 0,
      skippedRecords: 1,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(
      urlOf(fetchMock.mock.calls[0][0]).searchParams.get('filtro_tipo_vespa'),
    ).toBe('vespa_velutina');
    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it('serializes overlap and bounds detail concurrency to four', async () => {
    let active = 0;
    let maximum = 0;
    fetchMock.mockImplementation(async (input) => {
      if (urlOf(input).pathname.includes('embedded'))
        return new Response(
          Array.from(
            { length: 9 },
            (_, index) => `lsmk(43, 10, ${index + 1}, 23, 1);`,
          ).join('\n'),
        );
      active++;
      maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, 2));
      active--;
      return new Response(detailHtml);
    });
    expect(
      await Promise.all([fetchStopVelutina(), fetchStopVelutina()]),
    ).toEqual([
      { newObservations: 9, skippedRecords: 0 },
      { newObservations: 0, skippedRecords: 0 },
    ]);
    expect(maximum).toBe(4);
    expect(await rows(sources[0])).toHaveLength(9);
  });

  it('skips bad detail dates without substituting marker years', async () => {
    fetchMock.mockImplementation(
      async (input) =>
        new Response(
          urlOf(input).pathname.includes('embedded')
            ? mapHtml
            : 'Data: 31/02/2023',
        ),
    );
    expect(await fetchStopVelutina()).toEqual({
      newObservations: 0,
      skippedRecords: 3,
    });
    expect(await rows(sources[0])).toHaveLength(0);
    expect(redisClient.del).not.toHaveBeenCalled();
  });

  it('preserves existing data after HTTP/schema failures and recovers its queue', async () => {
    italyFeed();
    await fetchStopVelutina();
    fetchMock.mockImplementation(async () => new Response('', { status: 503 }));
    await expect(fetchStopVelutina()).rejects.toThrow('HTTP 503');
    fetchMock.mockImplementation(async () => new Response('Maintenance'));
    await expect(fetchStopVelutina()).rejects.toThrow('no marker calls');
    italyFeed();
    expect((await fetchStopVelutina()).newObservations).toBe(0);
    expect(await rows(sources[0])).toHaveLength(2);
  });

  it('does not partially write when a detail request fails', async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = urlOf(input);
      if (url.pathname.includes('embedded')) return new Response(mapHtml);
      return url.searchParams.get('id') === 'c_infobox_110'
        ? new Response(detailHtml)
        : new Response('', { status: 504 });
    });
    await expect(fetchStopVelutina()).rejects.toThrow('HTTP 504');
    expect(await rows(sources[0])).toHaveLength(0);
  });
});

describe('STOPvespa synchronization', () => {
  it('uses confirmed-only allowlisted paginated queries; deduplicates UUIDs, not joined ObjectIds', async () => {
    const second = structuredClone(confirmed);
    second.features[0].attributes.ObjectId++;
    fetchMock
      .mockResolvedValueOnce(
        json({ ...confirmed, exceededTransferLimit: true }),
      )
      .mockResolvedValueOnce(json(second));
    expect(await fetchStopVespa()).toEqual({
      newObservations: 1,
      updatedObservations: 0,
      skippedRecords: 0,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [input, init] of fetchMock.mock.calls) {
      const url = urlOf(input);
      expect(url.pathname).toContain(
        '/STOPvespa_municipio_dados_vespa/FeatureServer/0/query',
      );
      expect(url.searchParams.get('outFields')).toBe(
        'ObjectId,globalid,data_observ,tipo_observ,tipo,exterminad,data_exter',
      );
      expect(url.searchParams.get('orderByFields')).toBe('ObjectId ASC');
      expect(url.searchParams.get('outSR')).toBe('4326');
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    }
    expect(
      urlOf(fetchMock.mock.calls[1][0]).searchParams.get('resultOffset'),
    ).toBe('1');
    const [record] = await rows(sources[1]);
    expect(record.external_id).toBeNull();
    expect(record.external_uuid).toBe(
      confirmed.features[0].attributes.globalid,
    );
    expect(record.location).toEqual({ x: 41.595138, y: -8.422755 });
    const recent = (await listRecentObservations(db, 'Vespa velutina')).find(
      (row) => row.observation_type === 'nest',
    );
    expect(JSON.parse(recent!.uri)).toBe(
      'https://stopvespa.icnf.pt/geovisualizador/',
    );
    expect(new Date(recent!.observed_at).toISOString()).toBe(
      '2026-09-13T11:00:00.000Z',
    );
  });

  it('preserves JSON-encoded URLs and UTC timestamps through the public response schema for non-UTC clients', async () => {
    const payload = structuredClone(confirmed);
    payload.features[0].attributes.data_observ = Date.parse(
      '2026-09-13T23:30:00Z',
    );
    payload.features[0].attributes.data_exter = Date.parse(
      '2026-09-13T23:30:00Z',
    );
    portugalFeed(payload);
    await fetchStopVespa();
    const app = Fastify().withTypeProvider<ZodTypeProvider>();
    app.setSerializerCompiler(serializerCompiler);
    const schema = { response: { 200: publicObservationListResponseSchema } };
    app.get('/recent', { schema }, () =>
      listRecentObservations(db, 'Vespa velutina'),
    );
    app.get('/year', { schema }, () =>
      listObservationsByYear(db, 'Vespa velutina', 2026),
    );
    try {
      for (const url of ['/recent', '/year']) {
        const response = await app.inject({ method: 'GET', url });
        expect(response.statusCode).toBe(200);
        const observations = publicObservationListResponseSchema.parse(
          response.json<unknown>(),
        );
        expect(observations).toHaveLength(1);
        expect(observations[0].uri).toBe(
          JSON.stringify('https://stopvespa.icnf.pt/geovisualizador/'),
        );
        expect(observations[0].observed_at).toBe('2026-09-13T23:30:00Z');
        expect(
          new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/Lisbon',
          }).format(new Date(observations[0].observed_at)),
        ).toBe('14/09/2026');
      }
    } finally {
      await app.close();
    }
  });

  it('includes December 31 observation times without including the next year', async () => {
    const payload = structuredClone(confirmed);
    payload.features = [
      '2025-12-31T00:00:00Z',
      '2025-12-31T23:59:59Z',
      '2026-01-01T00:00:00Z',
    ].map((date, index) => {
      const feature = structuredClone(confirmed.features[0]);
      Object.assign(feature.attributes, {
        ObjectId: index + 1,
        globalid: `469fa0ad-2966-4804-8bcd-e63a16ddd07${index}`,
        data_observ: Date.parse(date),
        data_exter: Date.parse(date),
      });
      return feature;
    });
    portugalFeed(payload);
    expect((await fetchStopVespa()).newObservations).toBe(3);
    const observations = await listObservationsByYear(
      db,
      'Vespa velutina',
      2025,
    );
    expect(
      observations.map((row) => new Date(row.observed_at).toISOString()).sort(),
    ).toEqual(['2025-12-31T00:00:00.000Z', '2025-12-31T23:59:59.000Z']);
  });

  it('updates UUIDs across joined-ID changes, invalidates old/new years and preserves absent records', async () => {
    portugalFeed();
    await fetchStopVespa();
    const [before] = await rows(sources[1]);
    const corrected = structuredClone(confirmed);
    Object.assign(corrected.features[0].attributes, {
      ObjectId: 2,
      data_observ: Date.parse('2025-03-01T11:00:00Z'),
      tipo_observ: 'vespa',
      tipo: null,
      exterminad: null,
      data_exter: null,
    });
    corrected.features[0].geometry = { x: -9, y: 40 };
    portugalFeed(corrected);
    vi.mocked(redisClient.del).mockClear();
    expect(await fetchStopVespa()).toEqual({
      newObservations: 0,
      updatedObservations: 1,
      skippedRecords: 0,
    });
    expect((await rows(sources[1]))[0]).toMatchObject({
      id: before.id,
      location: { x: 40, y: -9 },
      data: { observationType: 'hornet', destroyed: null },
    });
    expect(redisClient.del).toHaveBeenCalledWith(
      expect.arrayContaining([
        yearlyObservationsCacheKey('Vespa velutina', 2025),
        yearlyObservationsCacheKey('Vespa velutina', 2026),
      ]),
    );
    vi.mocked(redisClient.del).mockClear();
    expect((await fetchStopVespa()).updatedObservations).toBe(0);
    expect(redisClient.del).not.toHaveBeenCalled();
    portugalFeed({ ...confirmed, features: [] });
    await fetchStopVespa();
    expect(await rows(sources[1])).toHaveLength(1);
    expect(
      (await listObservationsByYear(db, 'Vespa velutina', 2025))[0]
        .observation_type,
    ).toBe('hornet');
  });

  it('serializes overlapping imports and isolates identical UUIDs in other providers', async () => {
    await insertObservations(db, [
      {
        external_uuid: confirmed.features[0].attributes.globalid,
        external_service: sources[2],
        observed_at: '2023-07-04',
        location: { lat: 43, lng: 10 },
        taxa: 'Vespa velutina',
      },
    ]);
    portugalFeed();
    expect(await Promise.all([fetchStopVespa(), fetchStopVespa()])).toEqual([
      { newObservations: 1, updatedObservations: 0, skippedRecords: 0 },
      { newObservations: 0, updatedObservations: 0, skippedRecords: 0 },
    ]);
    expect(await rows(sources[2])).toHaveLength(1);
  });

  it.each(['http', 'arcgis', 'schema', 'repeat', 'empty-limit', 'conflict'])(
    'rejects %s on a later page without any partial inserts/updates',
    async (failure) => {
      portugalFeed();
      await fetchStopVespa();
      const before = await rows(sources[1]);
      const changed = structuredClone(confirmed);
      changed.features[0].geometry.x = -9;
      fetchMock
        .mockReset()
        .mockResolvedValueOnce(
          json({ ...changed, exceededTransferLimit: true }),
        );
      const conflict = structuredClone(confirmed);
      conflict.features[0].attributes.ObjectId++;
      const bad: Record<string, Response> = {
        http: new Response('', { status: 503 }),
        arcgis: json({ error: { code: 500 } }),
        schema: json({ features: [] }),
        repeat: json(confirmed),
        'empty-limit': json({
          ...confirmed,
          features: [],
          exceededTransferLimit: true,
        }),
        conflict: json(conflict),
      };
      fetchMock.mockResolvedValueOnce(bad[failure]);
      await expect(fetchStopVespa()).rejects.toThrow();
      expect(await rows(sources[1])).toEqual(before);
      portugalFeed();
      expect((await fetchStopVespa()).newObservations).toBe(0);
    },
  );

  it('rolls back updates if the snapshot insert fails', async () => {
    portugalFeed();
    await fetchStopVespa();
    const before = await rows(sources[1]);
    const changed = structuredClone(confirmed);
    changed.features[0].geometry.x = -9;
    portugalFeed(changed);
    vi.spyOn(observationModule, 'insertObservations').mockRejectedValueOnce(
      new Error('database unavailable'),
    );
    vi.mocked(redisClient.del).mockClear();
    await expect(fetchStopVespa()).rejects.toThrow('database unavailable');
    expect(await rows(sources[1])).toEqual(before);
    expect(redisClient.del).not.toHaveBeenCalled();
  });

  it('compares dates at the existing database second precision', async () => {
    const payload = structuredClone(confirmed);
    payload.features[0].attributes.data_observ += 123;
    payload.features[0].attributes.data_exter += 123;
    portugalFeed(payload);
    await fetchStopVespa();
    expect((await fetchStopVespa()).updatedObservations).toBe(0);
  });

  it('checks the next page when a full page omits the transfer-limit flag', async () => {
    const features = Array.from({ length: 1000 }, (_, index) => ({
      ...confirmed.features[0],
      attributes: { ...confirmed.features[0].attributes, ObjectId: index + 1 },
    }));
    fetchMock
      .mockResolvedValueOnce(
        json({ ...confirmed, exceededTransferLimit: undefined, features }),
      )
      .mockResolvedValueOnce(json({ ...confirmed, features: [] }));
    expect((await fetchStopVespa()).newObservations).toBe(1);
    expect(
      urlOf(fetchMock.mock.calls[1][0]).searchParams.get('resultOffset'),
    ).toBe('1000');
  });

  it('rejects oversized pages before writing', async () => {
    const features = Array.from({ length: 1001 }, (_, index) => ({
      ...confirmed.features[0],
      attributes: { ...confirmed.features[0].attributes, ObjectId: index + 1 },
    }));
    portugalFeed({ ...confirmed, features });
    await expect(fetchStopVespa()).rejects.toThrow('transfer limit');
    expect(await rows(sources[1])).toHaveLength(0);
  });

  it('skips invalid records while preserving their existing rows', async () => {
    portugalFeed();
    await fetchStopVespa();
    const before = await rows(sources[1]);
    const invalid = structuredClone(confirmed);
    invalid.features[0].attributes.data_observ = 4702017600000;
    portugalFeed(invalid);
    expect(await fetchStopVespa()).toEqual({
      newObservations: 0,
      updatedObservations: 0,
      skippedRecords: 1,
    });
    expect(await rows(sources[1])).toEqual(before);
  });
});

describe('regular provider orchestration', () => {
  function allFeeds(failedSource: 'italy' | 'portugal' | 'none') {
    fetchMock.mockImplementation(async (input) => {
      const url = urlOf(input);
      if (url.hostname === 'www.beewatching.it') {
        if (failedSource === 'italy') return new Response('', { status: 503 });
        return new Response(
          url.pathname.includes('embedded') ? mapHtml : detailHtml,
        );
      }
      if (url.hostname === 'services9.arcgis.com')
        return failedSource === 'portugal'
          ? json({ error: { code: 500 } })
          : json(confirmed);
      if (
        url.hostname === 'api.inaturalist.org' ||
        url.hostname === 'observation.org'
      )
        return json({ results: [], next: null });
      if (url.hostname === 'www.artenfinder.net') return json({ result: [] });
      if (url.hostname === 'api.gbif.org') return json({ results: [] });
      if (url.hostname === 'frelonasiatique.ch')
        return json({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [7.498, 47.444] },
              properties: {
                observation_id: 990043,
                observation_date: '2026-01-02',
                observation_type: 'hornet',
                is_nest_observation: false,
                is_hornet_observation: true,
                canton: 'BL',
                municipality: 'Dittingen',
                nest_state: '',
              },
            },
          ],
        });
      if (url.hostname === 'signal.frelonsasiatiques.fr')
        return new Response('');
      if (url.hostname === 'www.bienengesundheit.at') {
        const snapshot = {
          data: {
            points: [
              {
                id: 990043,
                x: 47,
                y: 14,
                description: 'Beobachtet: 02.01.2026',
              },
            ],
          },
        };
        return new Response(
          `<div wire:snapshot="${JSON.stringify(snapshot).replaceAll('"', '&quot;')}"></div>`,
        );
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
  }
  afterEach(async () => {
    await db
      .deleteFrom('observations')
      .where('external_service', 'in', [
        'asiatischehornisse.ch',
        'Bienengesundheit.at',
      ])
      .where('external_id', '=', 990043)
      .execute();
  });
  it.each(['italy', 'portugal'] as const)(
    'isolates %s failure and still reaches final cache invalidation',
    async (source) => {
      allFeeds(source);
      const result = await fetchObservations();
      expect(
        source === 'italy' ? result.stopVelutina : result.stopVespa,
      ).toHaveProperty('error');
      expect(
        source === 'italy' ? result.stopVespa : result.stopVelutina,
      ).toHaveProperty('newObservations', 1);
      expect(redisClient.del).toHaveBeenCalledWith(
        recentObservationsCacheKey('Vespa velutina'),
      );
      expect(redisClient.del).toHaveBeenCalledWith(
        yearlyObservationsCacheKey('Vespa velutina', 2025),
      );
    },
  );
  it('never requests or includes the new sources for Aethina', async () => {
    allFeeds('none');
    const result = await fetchObservations('Aethina tumida');
    expect(result).not.toHaveProperty('stopVelutina');
    expect(result).not.toHaveProperty('stopVespa');
    expect(
      fetchMock.mock.calls.some(([input]) =>
        /beewatching|services9\.arcgis/.test(urlOf(input).hostname),
      ),
    ).toBe(false);
  });
});
