import { Validator } from '@/api/middlewares/validator.middleware';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import ExternalController from '@/api/controllers/external.controller';
import { z } from 'zod';
import ScaleDataController from '@/api/controllers/scale_data.controller';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/ical/:source/:api',
    { preHandler: Validator.handleSource },
    ExternalController.ical,
  );
  server.post('/stripe/webhook', {}, ExternalController.stripeWebhook);
  server.get(
    '/scale/:ident/:api',
    {
      schema: {
        querystring: z.object({
          action: z.string().regex(/^(CREATE|CREATE_DEMO)$/),
          datetime: z.string().datetime().optional(),
          weight: z.number().optional(),
          temp1: z.number().optional(),
          temp2: z.number().optional(),
          hum: z.number().optional(),
          rain: z.number().optional(),
          note: z.string().max(300).optional(),
        }),
      },
    },
    ScaleDataController.api,
  );

  done();
}
