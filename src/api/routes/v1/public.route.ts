import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import PublicController from '../../controllers/public.controller.js';
import { z } from 'zod';
import { numberSchema } from '../../utils/zod.util.js';
import { Taxa } from '../../models/observation.model.js';

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
        params: z.object({
          taxa: Taxa,
        }),
        response: {
          200: z.array(
            z.object({
              location: z.object({
                x: z.number(),
                y: z.number(),
              }),
              uri: z.string(),
              observed_at: z.date(),
            }),
          ),
        },
      },
    },
    PublicController.getPestObservationsRecent,
  );
  server.get(
    '/:taxa/observations/year/:year',
    {
      schema: {
        params: z.object({
          year: numberSchema,
          taxa: Taxa,
        }),
        response: {
          200: z.array(
            z.object({
              location: z.object({
                x: z.number(),
                y: z.number(),
              }),
              uri: z.string(),
              observed_at: z.date(),
            }),
          ),
        },
      },
    },
    PublicController.getPestObservationsYear,
  );
  server.get(
    '/:taxa/observations/stats',
    {
      schema: {
        params: z.object({
          taxa: Taxa,
        }),
      },
    },
    PublicController.getPestObservationsStats,
  );

  done();
}
