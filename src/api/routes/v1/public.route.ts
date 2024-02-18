import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import PublicController from '../../controllers/public.controller.js';
import { z } from 'zod';
import { numberSchema } from '../../utils/zod.util.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/velutina/observations/recent',
    {
      schema: {
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
    PublicController.getVelutinaObservationsRecent,
  );

  server.get(
    '/velutina/observations/year/:year',
    {
      schema: {
        params: z.object({
          year: numberSchema,
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
    PublicController.getVelutinaObservationsYear,
  );

  server.get(
    '/velutina/observations/stats',
    {},
    PublicController.getVelutinaObservationsStats,
  );
  server.get(
    '/velutina/observations/array',
    {},
    PublicController.getVelutinaObservationsArray,
  );

  done();
}
