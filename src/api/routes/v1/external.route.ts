import { Validator } from '../../hooks/validator.hook.js';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import ExternalController from '../../controllers/external.controller.js';
import { z } from 'zod';
import ScaleDataController from '../../controllers/scale_data.controller.js';

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
          weight: z.coerce.number().optional(),
          temp1: z.coerce.number().optional(),
          temp2: z.coerce.number().optional(),
          hum: z.coerce.number().optional(),
          rain: z.coerce.number().optional(),
          note: z.string().max(300).optional(),
        }),
      },
    },
    ScaleDataController.api,
  );

  done();
}
