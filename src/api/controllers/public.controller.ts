import type { FastifyRequest } from 'fastify';

import { KyselyServer } from '../../servers/kysely.server.js';
import {
  countObservationsByTaxa,
  listObservationsByYear,
  listRecentObservations,
  mapPublicTaxa,
} from '../modules/observation.module.js';
import type {
  PublicTaxaParams,
  PublicTaxaYearParams,
} from '../schemas/public.schema.js';

export default class PublicController {
  static async getPestObservationsRecent(req: FastifyRequest) {
    const taxa = mapPublicTaxa((req.params as PublicTaxaParams).taxa);
    return listRecentObservations(KyselyServer.getInstance().db, taxa);
  }

  static async getPestObservationsYear(req: FastifyRequest) {
    const taxa = mapPublicTaxa((req.params as PublicTaxaParams).taxa);
    const { year } = req.params as PublicTaxaYearParams;
    return listObservationsByYear(KyselyServer.getInstance().db, taxa, year);
  }

  static async getPestObservationsStats(req: FastifyRequest) {
    const taxa = mapPublicTaxa((req.params as PublicTaxaParams).taxa);
    return countObservationsByTaxa(KyselyServer.getInstance().db, taxa);
  }
}
