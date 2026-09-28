import type { FastifyReply, FastifyRequest } from 'fastify';

import { KyselyServer } from '../../servers/kysely.server.js';
import { cachedObservations } from '../modules/observation-cache.module.js';
import {
  countObservationsByTaxa,
  listObservationsByYear,
  listRecentObservations,
  mapPublicTaxa,
  recentObservationsCacheKey,
  observationStatsCacheKey,
  yearlyObservationsCacheKey,
} from '../modules/observation.module.js';
import type {
  PublicTaxaParams,
  PublicTaxaYearParams,
} from '../schemas/public.schema.js';

export default class PublicController {
  static async getPestObservationsRecent(
    req: FastifyRequest,
    reply: FastifyReply,
  ) {
    const taxa = mapPublicTaxa((req.params as PublicTaxaParams).taxa);
    reply.header('Cache-Control', 'public, max-age=3600');
    return cachedObservations(taxa, recentObservationsCacheKey(taxa), () =>
      listRecentObservations(KyselyServer.getInstance().db, taxa),
    );
  }

  static async getPestObservationsYear(
    req: FastifyRequest,
    reply: FastifyReply,
  ) {
    const taxa = mapPublicTaxa((req.params as PublicTaxaParams).taxa);
    const { year } = req.params as PublicTaxaYearParams;
    reply.header('Cache-Control', 'public, max-age=3600');
    return cachedObservations(
      taxa,
      yearlyObservationsCacheKey(taxa, year),
      () => listObservationsByYear(KyselyServer.getInstance().db, taxa, year),
    );
  }

  static async getPestObservationsStats(
    req: FastifyRequest,
    reply: FastifyReply,
  ) {
    const taxa = mapPublicTaxa((req.params as PublicTaxaParams).taxa);
    reply.header('Cache-Control', 'public, max-age=3600');
    return cachedObservations(taxa, observationStatsCacheKey(taxa), () =>
      countObservationsByTaxa(KyselyServer.getInstance().db, taxa),
    );
  }
}
