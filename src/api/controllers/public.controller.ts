import type { FastifyReply, FastifyRequest } from 'fastify';

import { KyselyServer } from '../../servers/kysely.server.js';
import { RedisServer } from '../../servers/redis.server.js';
import {
  countObservationsByTaxa,
  listObservationsByYear,
  listRecentObservations,
  mapPublicTaxa,
  recentObservationsCacheKey,
  yearlyObservationsCacheKey,
} from '../modules/observation.module.js';
import type {
  PublicTaxaParams,
  PublicTaxaYearParams,
} from '../schemas/public.schema.js';

function parseCached(cached: string | Buffer): unknown {
  const json = typeof cached === 'string' ? cached : cached.toString('utf8');
  return JSON.parse(json) as unknown;
}

export default class PublicController {
  static async getPestObservationsRecent(
    req: FastifyRequest,
    reply: FastifyReply,
  ) {
    const taxa = mapPublicTaxa((req.params as PublicTaxaParams).taxa);
    reply.header('Cache-Control', 'public, max-age=3600');
    const cacheKey = recentObservationsCacheKey(taxa);
    const redis = RedisServer.client;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return parseCached(cached) as Awaited<
        ReturnType<typeof listRecentObservations>
      >;
    }

    const result = await listRecentObservations(
      KyselyServer.getInstance().db,
      taxa,
    );
    void redis.set(cacheKey, JSON.stringify(result), { EX: 3600 });
    return result;
  }

  static async getPestObservationsYear(
    req: FastifyRequest,
    reply: FastifyReply,
  ) {
    const taxa = mapPublicTaxa((req.params as PublicTaxaParams).taxa);
    const { year } = req.params as PublicTaxaYearParams;
    reply.header('Cache-Control', 'public, max-age=3600');
    const cacheKey = yearlyObservationsCacheKey(taxa, year);
    const redis = RedisServer.client;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return parseCached(cached) as Awaited<
        ReturnType<typeof listObservationsByYear>
      >;
    }

    const result = await listObservationsByYear(
      KyselyServer.getInstance().db,
      taxa,
      year,
    );
    void redis.set(cacheKey, JSON.stringify(result), { EX: 3600 });
    return result;
  }

  static async getPestObservationsStats(
    req: FastifyRequest,
    reply: FastifyReply,
  ) {
    const taxa = mapPublicTaxa((req.params as PublicTaxaParams).taxa);
    reply.header('Cache-Control', 'public, max-age=3600');
    return countObservationsByTaxa(KyselyServer.getInstance().db, taxa);
  }
}
