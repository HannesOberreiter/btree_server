/**
 * Public observation caching (recent, yearly, and statistics responses).
 *
 * Redis entries and public HTTP responses retain a one-hour TTL. Import jobs
 * cannot invalidate responses already cached by browsers or shared HTTP caches.
 * Concurrent misses share one database query per key/generation within this
 * process; this is not a distributed lock or a replacement for rate limiting.
 * Redis commands time out after one second. Disconnections, failed reads, and
 * malformed envelopes fall back to the database; failed writes preserve results.
 *
 * A persistent generation token per taxon invalidates all views, including every
 * historical year, without scanning Redis or touching sessions. Payloads carry
 * the generation captured before their query, so stale in-flight queries cannot
 * fill an entry accepted after invalidation. Invalidated entries expire normally
 * rather than being deleted immediately; only one payload is stored per key.
 *
 * The main import invalidates both taxa in finally: legacy imports can partially
 * commit and cleanup spans both taxa. Swiss, Italian, and Portuguese imports also
 * invalidate after changed data commits, including standalone monthly Swiss syncs.
 * Invalidation failures are logged without masking import results. During a Redis
 * outage, old entries may remain stale until expiry or a later invalidation.
 */
import { randomUUID } from 'node:crypto';

import { RedisServer } from '../../servers/redis.server.js';
import { Logger } from '../../services/logger.service.js';
import type { Taxa } from './observation.module.js';

const CACHE_TTL_SECONDS = 3600;
const REDIS_TIMEOUT_MS = 1000;
const pending = new Map<string, Promise<unknown>>();

function generationKey(taxa: Taxa): string {
  return `cache:${taxa}ObservationsGeneration:v1`;
}

async function redisDeadline<T>(command: Promise<T>): Promise<T> {
  // node-redis's command timeout covers its write queue, not waiting for replies.
  // Bound our wait independently without disconnecting the shared session client.
  let timer!: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error('Observation cache Redis timeout')),
      REDIS_TIMEOUT_MS,
    );
  });
  try {
    return await Promise.race([command, deadline]);
  } finally {
    clearTimeout(timer);
  }
}

function coalesce<T>(key: string, load: () => Promise<T>): Promise<T> {
  const existing = pending.get(key);
  if (existing) return existing as Promise<T>;

  const result = load().finally(() => pending.delete(key));
  pending.set(key, result);
  return result;
}

/** Cache public map responses; simultaneous misses share one query per process. */
export async function cachedObservations<T>(
  taxa: Taxa,
  cacheKey: string,
  load: () => Promise<T>,
): Promise<T> {
  const client = RedisServer.client;
  if (!client?.isReady) return coalesce(`${cacheKey}:uncached`, load);

  const redis = client.withCommandOptions({ timeout: REDIS_TIMEOUT_MS });
  let generation: string;
  try {
    const versionKey = generationKey(taxa);
    const existing = await redisDeadline(redis.get(versionKey));
    if (existing !== null) {
      generation = existing;
    } else {
      const candidate = randomUUID();
      const created = await redisDeadline(
        redis.set(versionKey, candidate, { NX: true }),
      );
      const current =
        created === 'OK'
          ? candidate
          : await redisDeadline(redis.get(versionKey));
      if (current === null)
        throw new Error('Observation cache generation is missing');
      generation = current;
    }
  } catch (error) {
    Logger.getInstance().log('warn', 'Failed to read observation cache', {
      error,
      cacheKey,
    });
    return coalesce(`${cacheKey}:uncached`, load);
  }

  return coalesce(`${cacheKey}:${generation}`, async () => {
    try {
      const cached = await redisDeadline(redis.get(cacheKey));
      if (cached !== null) {
        const entry: unknown = JSON.parse(cached);
        if (
          typeof entry !== 'object' ||
          entry === null ||
          !('generation' in entry) ||
          !('value' in entry)
        ) {
          throw new Error('Invalid observation cache entry');
        }
        if (entry.generation === generation) return entry.value as T;
      }
    } catch (error) {
      Logger.getInstance().log('warn', 'Failed to read observation cache', {
        error,
        cacheKey,
      });
    }

    const value = await load();
    try {
      // Keep the captured generation: a query started before invalidation must
      // never repopulate the cache with data accepted by newer requests.
      await redisDeadline(
        redis.set(cacheKey, JSON.stringify({ generation, value }), {
          EX: CACHE_TTL_SECONDS,
        }),
      );
    } catch (error) {
      Logger.getInstance().log('warn', 'Failed to cache public observations', {
        error,
        cacheKey,
      });
    }
    return value;
  });
}

/** Invalidate recent, stats, and every historical year without scanning Redis. */
export async function invalidateObservationCache(taxa: Taxa): Promise<void> {
  try {
    const client = RedisServer.client;
    if (!client?.isReady) throw new Error('Redis is not ready');
    await redisDeadline(
      client
        .withCommandOptions({ timeout: REDIS_TIMEOUT_MS })
        .set(generationKey(taxa), randomUUID()),
    );
  } catch (error) {
    Logger.getInstance().log('warn', 'Failed to invalidate observation cache', {
      error,
      taxa,
    });
  }
}
