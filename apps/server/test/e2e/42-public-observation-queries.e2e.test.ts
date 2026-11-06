/**
 * Exercise the real public routes/controllers with mocked database loaders.
 * Fastify.inject is in-process; no HTTP requests go to the beta API.
 */
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as observations from '../../src/api/modules/observation.module.js';
import publicRoutes from '../../src/api/routes/v1/public.route.js';

const mocks = vi.hoisted(() => ({ db: {} }));
vi.mock('../../src/servers/kysely.server.js', () => ({
  KyselyServer: { getInstance: () => ({ db: mocks.db }) },
}));
vi.mock('../../src/servers/redis.server.js', () => {
  throw new Error('Public observation queries must not depend on Redis');
});

const cases = (['velutina', 'aethina_tumida'] as const).flatMap((taxa) =>
  ['recent', 'year/2025', 'stats'].map((suffix) => ({
    url: `/api/v1/public/${taxa}/observations/${suffix}`,
    taxa: observations.mapPublicTaxa(taxa),
    suffix,
  })),
);

let server: FastifyInstance;
beforeEach(async () => {
  vi.spyOn(observations, 'listRecentObservations').mockResolvedValue([]);
  vi.spyOn(observations, 'listObservationsByYear').mockResolvedValue([]);
  vi.spyOn(observations, 'countObservationsByTaxa').mockResolvedValue({
    count: 1,
  });
  server = Fastify();
  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);
  await server.register(publicRoutes, { prefix: '/api/v1/public' });
  await server.ready();
});
afterEach(async () => {
  await server.close();
  vi.restoreAllMocks();
});

function loaderFor(suffix: string) {
  if (suffix === 'recent')
    return vi.mocked(observations.listRecentObservations);
  if (suffix === 'stats')
    return vi.mocked(observations.countObservationsByTaxa);
  return vi.mocked(observations.listObservationsByYear);
}

describe('public observation queries without an origin cache', () => {
  it.each(cases)('queries the DB for $url', async ({ url, taxa, suffix }) => {
    const response = await server.inject({ url });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(suffix === 'stats' ? { count: 1 } : []);
    expect(response.headers['x-btree-public-cache']).toBe('eligible');
    expect(response.headers['cache-control']).toBe('public, max-age=0');
    const args =
      suffix === 'year/2025' ? [mocks.db, taxa, 2025] : [mocks.db, taxa];
    expect(loaderFor(suffix)).toHaveBeenCalledExactlyOnceWith(...args);
  });

  it.each(cases)(
    'queries independently on repeated/concurrent $url requests',
    async ({ url, suffix }) => {
      expect((await server.inject({ url })).statusCode).toBe(200);
      const responses = await Promise.all([
        server.inject({ url }),
        server.inject({ url }),
      ]);
      expect(responses.map((response) => response.statusCode)).toEqual([
        200, 200,
      ]);
      expect(loaderFor(suffix)).toHaveBeenCalledTimes(3);
    },
  );

  it.each(cases)('does not hide DB errors on $url', async ({ url, suffix }) => {
    loaderFor(suffix).mockRejectedValueOnce(new Error('database unavailable'));
    const response = await server.inject({ url });
    expect(response.statusCode).toBe(500);
    expect(response.headers['x-btree-public-cache']).toBe('bypass');
    expect(response.headers['cache-control']).toBe('private, no-store');
  });

  it('returns updated statistics immediately at the origin without invalidation', async () => {
    vi.mocked(observations.countObservationsByTaxa)
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 2 });
    const url = '/api/v1/public/velutina/observations/stats';
    expect((await server.inject({ url })).json()).toEqual({ count: 1 });
    expect((await server.inject({ url })).json()).toEqual({ count: 2 });
  });
});
