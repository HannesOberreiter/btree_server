import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import PublicController from '../../controllers/public.controller.js';
import {
  permissiveJsonResponseSchema,
  compatibilityQuerySchema,
} from '../../schemas/common.schema.js';
import {
  publicTaxaParamsSchema,
  publicTaxaYearParamsSchema,
} from '../../schemas/public.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/:taxa/observations/recent',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        params: publicTaxaParamsSchema,
        response: {
          200: z.array(
            z.object({
              location: z.object({
                x: z.number(),
                y: z.number(),
              }),
              uri: z.string(),
              observed_at: z.union([z.string(), z.date()]),
            }),
          ),
        },
      },
    },
    PublicController.getPestObservationsRecent as any,
  );
  server.get(
    '/:taxa/observations/year/:year',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        params: publicTaxaYearParamsSchema,
        response: {
          200: z.array(
            z.object({
              location: z.object({
                x: z.number(),
                y: z.number(),
              }),
              uri: z.string(),
              observed_at: z.union([z.string(), z.date()]),
            }),
          ),
        },
      },
    },
    PublicController.getPestObservationsYear as any,
  );
  server.get(
    '/:taxa/observations/stats',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
        params: publicTaxaParamsSchema,
      },
    },
    PublicController.getPestObservationsStats,
  );

  done();
}
