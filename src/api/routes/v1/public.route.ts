import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import PublicController from '../../controllers/public.controller.js';
import {
  publicObservationListResponseSchema,
  publicObservationStatsResponseSchema,
  publicTaxaParamsSchema,
  publicTaxaYearParamsSchema,
} from '../../schemas/public.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: unknown,
  done: () => void,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/:taxa/observations/recent',
    {
      schema: {
        params: publicTaxaParamsSchema,
        response: { 200: publicObservationListResponseSchema },
      },
    },
    PublicController.getPestObservationsRecent,
  );

  server.get(
    '/:taxa/observations/year/:year',
    {
      schema: {
        params: publicTaxaYearParamsSchema,
        response: { 200: publicObservationListResponseSchema },
      },
    },
    PublicController.getPestObservationsYear,
  );

  server.get(
    '/:taxa/observations/stats',
    {
      schema: {
        response: { 200: publicObservationStatsResponseSchema },
        params: publicTaxaParamsSchema,
      },
    },
    PublicController.getPestObservationsStats,
  );

  done();
}
