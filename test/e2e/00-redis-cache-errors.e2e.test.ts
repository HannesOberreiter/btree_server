import { setImmediate } from 'node:timers/promises';

import Fastify from 'fastify';
import { TimeoutError } from 'redis';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchObservations } from '../../src/api/adapters/pest.adapter.js';
import PublicController from '../../src/api/controllers/public.controller.js';
import * as observations from '../../src/api/modules/observation.module.js';

const mocks = vi.hoisted(() => ({
  get: vi.fn<(key: string) => Promise<string | null>>(),
  set: vi.fn<
    (key: string, value: string, options: unknown) => Promise<string>
  >(),
  del: vi.fn<(key: string) => Promise<number>>(),
  log: vi.fn(),
}));

vi.mock('../../src/servers/kysely.server.js', () => ({
  KyselyServer: { getInstance: () => ({ db: {} }) },
}));
vi.mock('../../src/servers/redis.server.js', () => ({
  RedisServer: { client: mocks },
}));
vi.mock('../../src/services/logger.service.js', () => ({
  Logger: { getInstance: () => ({ log: mocks.log }) },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockResolvedValue(null);
  mocks.set.mockResolvedValue('OK');
  mocks.del.mockResolvedValue(1);
  vi.spyOn(observations, 'listRecentObservations').mockResolvedValue([]);
  vi.spyOn(observations, 'listObservationsByYear').mockResolvedValue([]);
  vi.spyOn(observations, 'getRandomObservationSample').mockResolvedValue([]);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-14T12:00:00Z'));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('detached Redis cache command failures', () => {
  it.each(['recent', 'year'] as const)(
    'logs a timed-out %s cache write without rejecting the response',
    async (period) => {
      const error = new TimeoutError();
      mocks.set.mockRejectedValue(error);
      const app = Fastify();
      app.get('/:taxa/recent', PublicController.getPestObservationsRecent);
      app.get('/:taxa/year/:year', PublicController.getPestObservationsYear);
      try {
        const response = await app.inject({
          method: 'GET',
          url: `/velutina/${period === 'recent' ? 'recent' : 'year/2026'}`,
        });
        await setImmediate();
        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual([]);
        expect(response.headers['cache-control']).toBe('public, max-age=3600');
        const cacheKey =
          period === 'recent'
            ? observations.recentObservationsCacheKey('Vespa velutina')
            : observations.yearlyObservationsCacheKey('Vespa velutina', 2026);
        expect(mocks.set).toHaveBeenCalledWith(cacheKey, '[]', { EX: 3600 });
        expect(mocks.log).toHaveBeenCalledExactlyOnceWith(
          'warn',
          'Failed to cache public observations',
          { error, cacheKey },
        );
      } finally {
        await app.close();
      }
    },
  );

  it('handles every failed invalidation without losing the import result', async () => {
    const error = new TimeoutError();
    mocks.del.mockRejectedValue(error);
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(async (input) => {
        const url = new URL(
          input instanceof Request ? input.url : String(input),
        );
        if (
          ![
            'api.inaturalist.org',
            'observation.org',
            'www.artenfinder.net',
            'api.gbif.org',
          ].includes(url.hostname)
        ) {
          throw new Error(`Unexpected feed: ${url.hostname}`);
        }
        return new Response(
          JSON.stringify({ results: [], result: [], next: null }),
        );
      }),
    );

    const result = await fetchObservations('Aethina tumida');
    await setImmediate();
    expect(result).toMatchObject({
      taxa: 'Aethina tumida',
      infoFaunaCh: { newObservations: 0 },
    });
    const keys = [
      observations.recentObservationsCacheKey('Aethina tumida'),
      observations.yearlyObservationsCacheKey('Aethina tumida', 2026),
      observations.yearlyObservationsCacheKey('Aethina tumida', 2025),
    ];
    expect(mocks.del.mock.calls.map(([key]) => key)).toEqual(keys);
    expect(mocks.log).toHaveBeenCalledTimes(3);
    for (const cacheKey of keys) {
      expect(mocks.log).toHaveBeenCalledWith(
        'warn',
        'Failed to invalidate observation cache',
        { error, cacheKey },
      );
    }
  });
});
