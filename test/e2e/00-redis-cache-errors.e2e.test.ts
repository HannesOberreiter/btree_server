import { setImmediate } from 'node:timers/promises';

import Fastify from 'fastify';
import { TimeoutError } from 'redis';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchObservations } from '../../src/api/adapters/pest.adapter.js';
import PublicController from '../../src/api/controllers/public.controller.js';
import * as observations from '../../src/api/modules/observation.module.js';

const mocks = vi.hoisted(() => ({
  isReady: true,
  withCommandOptions: vi.fn(),
  insertExecute: vi.fn<() => Promise<unknown>>(),
  get: vi.fn<(key: string) => Promise<string | null>>(),
  set: vi.fn<
    (key: string, value: string, options: unknown) => Promise<string>
  >(),
  log: vi.fn(),
}));

vi.mock('../../src/servers/kysely.server.js', () => ({
  KyselyServer: {
    getInstance: () => ({
      db: {
        insertInto: () => ({
          values: () => ({ execute: mocks.insertExecute }),
        }),
      },
    }),
  },
}));
vi.mock('../../src/servers/redis.server.js', () => ({
  RedisServer: { client: mocks },
}));
vi.mock('../../src/services/logger.service.js', () => ({
  Logger: { getInstance: () => ({ log: mocks.log }) },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.withCommandOptions.mockReturnValue(mocks);
  mocks.get.mockImplementation(async (key) =>
    key.includes('Generation:') ? 'test-generation' : null,
  );
  mocks.set.mockResolvedValue('OK');
  mocks.insertExecute.mockReset().mockResolvedValue({});
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

describe('Redis cache command failures', () => {
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
        expect(mocks.set).toHaveBeenCalledWith(
          cacheKey,
          JSON.stringify({ generation: 'test-generation', value: [] }),
          { EX: 3600 },
        );
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

  it.each([false, true])(
    'invalidates both taxa after a partially committed historical batch (Redis failure: %s)',
    async (redisFails) => {
      const records = Array.from({ length: 501 }, (_, index) => ({
        id: index + 1,
        time_observed_at: '2010-06-01T00:00:00Z',
        location: '47,8',
      }));
      vi.spyOn(
        observations,
        'filterNewObservationExternalIds',
      ).mockResolvedValue(new Set(records.map((record) => record.id)));
      mocks.insertExecute
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('second batch failed'));
      if (redisFails) mocks.set.mockRejectedValue(new Error('Redis failed'));
      vi.stubGlobal(
        'fetch',
        vi
          .fn<typeof fetch>()
          .mockResolvedValue(
            new Response(JSON.stringify({ results: records })),
          ),
      );

      await expect(fetchObservations('Vespa velutina')).rejects.toThrow(
        'second batch failed',
      );
      expect(mocks.insertExecute).toHaveBeenCalledTimes(2);
      expect(mocks.set.mock.calls.map(([key]) => key)).toEqual([
        'cache:Vespa velutinaObservationsGeneration:v1',
        'cache:Aethina tumidaObservationsGeneration:v1',
      ]);
    },
  );

  it('awaits invalidation before propagating a provider failure', async () => {
    const completions: Array<(value: string) => void> = [];
    mocks.set.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          completions.push(resolve);
        }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockRejectedValue(new Error('provider failed')),
    );
    let completed = false;
    const result = fetchObservations('Vespa velutina').catch(
      (error: unknown) => {
        completed = true;
        return error;
      },
    );
    await vi.waitFor(() => expect(completions).toHaveLength(2));
    expect(completed).toBe(false);
    for (const finish of completions) finish('OK');
    expect(await result).toEqual(new Error('provider failed'));
  });

  it('handles every failed invalidation without losing the import result', async () => {
    const error = new TimeoutError();
    mocks.set.mockRejectedValue(error);
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
    const taxa = ['Vespa velutina', 'Aethina tumida'];
    expect(mocks.set.mock.calls.map(([key]) => key)).toEqual(
      taxa.map((name) => `cache:${name}ObservationsGeneration:v1`),
    );
    expect(mocks.log).toHaveBeenCalledTimes(2);
    for (const name of taxa) {
      expect(mocks.log).toHaveBeenCalledWith(
        'warn',
        'Failed to invalidate observation cache',
        { error, taxa: name },
      );
    }
  });
});
