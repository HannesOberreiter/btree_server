import Fastify from 'fastify';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import PublicController from '../../src/api/controllers/public.controller.js';
import {
  cachedObservations,
  invalidateObservationCache,
} from '../../src/api/modules/observation-cache.module.js';
import * as observations from '../../src/api/modules/observation.module.js';

const mocks = vi.hoisted(() => ({
  ready: true,
  values: new Map<string, string>(),
  get: vi.fn<(key: string) => Promise<string | null>>(),
  set: vi.fn<
    (
      key: string,
      value: string,
      options?: { EX?: number; NX?: boolean },
    ) => Promise<string | null>
  >(),
  withCommandOptions: vi.fn(),
  log: vi.fn(),
}));

vi.mock('../../src/servers/kysely.server.js', () => ({
  KyselyServer: { getInstance: () => ({ db: {} }) },
}));
vi.mock('../../src/servers/redis.server.js', () => ({
  RedisServer: {
    client: {
      get isReady() {
        return mocks.ready;
      },
      withCommandOptions: mocks.withCommandOptions,
    },
  },
}));
vi.mock('../../src/services/logger.service.js', () => ({
  Logger: { getInstance: () => ({ log: mocks.log }) },
}));

const taxa = 'Vespa velutina';
const otherTaxa = 'Aethina tumida';
const key = observations.recentObservationsCacheKey(taxa);
const versionKey = `cache:${taxa}ObservationsGeneration:v1`;

beforeEach(() => {
  vi.resetAllMocks();
  mocks.ready = true;
  mocks.values.clear();
  mocks.values.set(versionKey, 'original');
  mocks.values.set(`cache:${otherTaxa}ObservationsGeneration:v1`, 'original');
  mocks.withCommandOptions.mockReturnValue(mocks);
  mocks.get.mockImplementation(async (key) => mocks.values.get(key) ?? null);
  mocks.set.mockImplementation(async (key, value, options) => {
    if (options?.NX && mocks.values.has(key)) return null;
    mocks.values.set(key, value);
    return 'OK';
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it.each(['recent', 'year', 'stats'] as const)(
  'caches the public %s endpoint without changing its response or HTTP TTL',
  async (period) => {
    const recent = vi
      .spyOn(observations, 'listRecentObservations')
      .mockResolvedValue([]);
    const year = vi
      .spyOn(observations, 'listObservationsByYear')
      .mockResolvedValue([]);
    const stats = vi
      .spyOn(observations, 'countObservationsByTaxa')
      .mockResolvedValue({ count: 7 });
    const app = Fastify();
    app.get('/:taxa/recent', PublicController.getPestObservationsRecent);
    app.get('/:taxa/year/:year', PublicController.getPestObservationsYear);
    app.get('/:taxa/stats', PublicController.getPestObservationsStats);
    const url = `/velutina/${period === 'year' ? 'year/2026' : period}`;
    try {
      for (let i = 0; i < 2; i++) {
        const response = await app.inject({ method: 'GET', url });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual(period === 'stats' ? { count: 7 } : []);
        expect(response.headers['cache-control']).toBe('public, max-age=3600');
      }
      expect({ recent, year, stats }[period]).toHaveBeenCalledOnce();
      expect(mocks.set).toHaveBeenCalledOnce();
      expect(mocks.set.mock.calls[0]?.[2]).toEqual({ EX: 3600 });
      expect(mocks.withCommandOptions).toHaveBeenCalledWith({ timeout: 1000 });
    } finally {
      await app.close();
    }
  },
);

it.each([
  'generation read',
  'generation creation',
  'payload read',
  'payload write',
  'invalidation',
] as const)(
  'bounds an unresponsive Redis %s to one second',
  async (operation) => {
    vi.useFakeTimers();
    let release!: (value: string) => void;
    const stalled = new Promise<string>((resolve) => {
      release = resolve;
    });
    if (operation === 'generation read') mocks.get.mockReturnValueOnce(stalled);
    if (operation === 'generation creation') {
      mocks.values.delete(versionKey);
      mocks.set.mockReturnValueOnce(stalled);
    }
    if (operation === 'payload read') {
      mocks.get.mockResolvedValueOnce('original').mockReturnValueOnce(stalled);
    }
    if (operation === 'payload write' || operation === 'invalidation') {
      mocks.set.mockReturnValueOnce(stalled);
    }
    let completed = false;
    const request = (
      operation === 'invalidation'
        ? invalidateObservationCache(taxa)
        : cachedObservations(taxa, key, async () => [1])
    ).then((value) => {
      completed = true;
      return value;
    });
    try {
      await vi.advanceTimersByTimeAsync(999);
      expect(completed).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(completed).toBe(true);
      expect(await request).toEqual(
        operation === 'invalidation' ? undefined : [1],
      );
      expect(vi.getTimerCount()).toBe(0);
      expect(mocks.log).toHaveBeenCalled();
    } finally {
      release('OK');
      await request;
    }
  },
);

it('handles a Redis rejection arriving after its reply deadline', async () => {
  vi.useFakeTimers();
  let reject!: (error: Error) => void;
  mocks.get.mockReturnValueOnce(
    new Promise<string>((_, rejectCommand) => {
      reject = rejectCommand;
    }),
  );
  const request = cachedObservations(taxa, key, async () => [1]);
  await vi.advanceTimersByTimeAsync(1000);
  await expect(request).resolves.toEqual([1]);
  reject(new Error('late Redis failure'));
  await vi.advanceTimersByTimeAsync(0);
  expect(vi.getTimerCount()).toBe(0);
});

it('clears reply deadline timers after successful Redis operations', async () => {
  vi.useFakeTimers();
  await cachedObservations(taxa, key, async () => [1]);
  await invalidateObservationCache(taxa);
  expect(vi.getTimerCount()).toBe(0);
});

it('coalesces concurrent misses into one query', async () => {
  let finish!: (value: number[]) => void;
  const load = vi.fn(
    () =>
      new Promise<number[]>((resolve) => {
        finish = resolve;
      }),
  );
  const requests = Array.from({ length: 20 }, () =>
    cachedObservations(taxa, key, load),
  );
  await vi.waitFor(() => expect(load).toHaveBeenCalledOnce());
  finish([1]);
  expect(await Promise.all(requests)).toEqual(
    Array.from({ length: 20 }, () => [1]),
  );
  expect(load).toHaveBeenCalledOnce();
  expect(mocks.set).toHaveBeenCalledOnce();
});

it('coalesces DB fallback when Redis is disconnected', async () => {
  mocks.ready = false;
  let finish!: (value: number[]) => void;
  const load = vi.fn(
    () =>
      new Promise<number[]>((resolve) => {
        finish = resolve;
      }),
  );
  const requests = Array.from({ length: 10 }, () =>
    cachedObservations(taxa, key, load),
  );
  expect(load).toHaveBeenCalledOnce();
  finish([]);
  await Promise.all(requests);
  expect(mocks.get).not.toHaveBeenCalled();
  expect(mocks.set).not.toHaveBeenCalled();
});

it.each(['generation', 'payload'])(
  'falls back to DB when the Redis %s read fails',
  async (stage) => {
    if (stage === 'payload') mocks.get.mockResolvedValueOnce('original');
    mocks.get.mockRejectedValueOnce(new Error('Redis timeout'));
    const load = vi.fn().mockResolvedValue([1]);
    await expect(cachedObservations(taxa, key, load)).resolves.toEqual([1]);
    expect(load).toHaveBeenCalledOnce();
    expect(mocks.log).toHaveBeenCalledWith(
      'warn',
      'Failed to read observation cache',
      expect.any(Object),
    );
  },
);

it.each(['not json', 'null', '[]', '{}'])(
  'replaces malformed cache entry %s using the DB',
  async (cached) => {
    mocks.values.set(key, cached);
    const load = vi.fn().mockResolvedValue([1]);
    await expect(cachedObservations(taxa, key, load)).resolves.toEqual([1]);
    await expect(cachedObservations(taxa, key, load)).resolves.toEqual([1]);
    expect(load).toHaveBeenCalledOnce();
  },
);

it('returns data despite cache write failure', async () => {
  mocks.set.mockRejectedValue(new Error('Redis timeout'));
  await expect(cachedObservations(taxa, key, async () => [1])).resolves.toEqual(
    [1],
  );
  expect(mocks.log).toHaveBeenCalledWith(
    'warn',
    'Failed to cache public observations',
    expect.any(Object),
  );
});

it('releases a failed in-flight query so a later request can retry', async () => {
  const load = vi
    .fn()
    .mockRejectedValueOnce(new Error('DB failed'))
    .mockResolvedValueOnce([1]);
  await expect(cachedObservations(taxa, key, load)).rejects.toThrow(
    'DB failed',
  );
  await expect(cachedObservations(taxa, key, load)).resolves.toEqual([1]);
  expect(load).toHaveBeenCalledTimes(2);
});

it('invalidates recent, stats, and historical years without touching other taxa or sessions', async () => {
  const keys = [
    key,
    observations.observationStatsCacheKey(taxa),
    observations.yearlyObservationsCacheKey(taxa, 2010),
  ];
  const load = vi.fn().mockResolvedValue([1]);
  const otherLoad = vi.fn().mockResolvedValue([2]);
  const otherKey = observations.recentObservationsCacheKey(otherTaxa);
  mocks.values.set('btree_sess:example', 'session');
  for (const cacheKey of keys) await cachedObservations(taxa, cacheKey, load);
  await cachedObservations(otherTaxa, otherKey, otherLoad);
  await invalidateObservationCache(taxa);
  load.mockResolvedValue([3]);
  for (const cacheKey of keys) {
    await expect(cachedObservations(taxa, cacheKey, load)).resolves.toEqual([
      3,
    ]);
  }
  await expect(
    cachedObservations(otherTaxa, otherKey, otherLoad),
  ).resolves.toEqual([2]);
  expect(load).toHaveBeenCalledTimes(6);
  expect(otherLoad).toHaveBeenCalledOnce();
  expect(mocks.values.get('btree_sess:example')).toBe('session');
});

it('does not serve a stale fill after invalidation, including a fill that overwrites a newer entry', async () => {
  let finish!: (value: number[]) => void;
  const oldLoad = vi.fn(
    () =>
      new Promise<number[]>((resolve) => {
        finish = resolve;
      }),
  );
  const oldRequest = cachedObservations(taxa, key, oldLoad);
  await vi.waitFor(() => expect(oldLoad).toHaveBeenCalledOnce());
  await invalidateObservationCache(taxa);
  const freshLoad = vi.fn().mockResolvedValue([2]);
  await expect(cachedObservations(taxa, key, freshLoad)).resolves.toEqual([2]);
  finish([1]);
  await expect(oldRequest).resolves.toEqual([1]);
  await expect(cachedObservations(taxa, key, freshLoad)).resolves.toEqual([2]);
});

it('initializes a fresh generation after metadata eviction instead of trusting old entries', async () => {
  const load = vi.fn().mockResolvedValueOnce([1]).mockResolvedValueOnce([2]);
  await cachedObservations(taxa, key, load);
  await invalidateObservationCache(taxa);
  mocks.values.delete(versionKey);
  await expect(cachedObservations(taxa, key, load)).resolves.toEqual([2]);
  expect(mocks.values.get(versionKey)).not.toBe('original');
  expect(mocks.set).toHaveBeenCalledWith(versionKey, expect.any(String), {
    NX: true,
  });
});

it('uses the generation created by another process when initialization races', async () => {
  mocks.get.mockResolvedValueOnce(null);
  const load = vi.fn().mockResolvedValue([1]);
  await cachedObservations(taxa, key, load);
  expect(JSON.parse(mocks.values.get(key)!)).toEqual({
    generation: 'original',
    value: [1],
  });
});

it('logs failed invalidation without throwing away a committed import result', async () => {
  mocks.set.mockRejectedValue(new Error('Redis unavailable'));
  await expect(invalidateObservationCache(taxa)).resolves.toBeUndefined();
  expect(mocks.log).toHaveBeenCalledWith(
    'warn',
    'Failed to invalidate observation cache',
    expect.objectContaining({ taxa }),
  );
});
