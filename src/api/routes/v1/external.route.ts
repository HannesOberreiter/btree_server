import fastifyFormbody from '@fastify/formbody';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import ExternalController from '../../controllers/external.controller.js';
import ScaleDataController from '../../controllers/scale_data.controller.js';
import { Validator } from '../../hooks/validator.hook.js';

const SCALE_ACTION_REGEX = /^(CREATE|CREATE_DEMO)$/;

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.register(fastifyFormbody);

  server.get(
    '/ical/:source/:api',
    { preHandler: Validator.handleSource },
    ExternalController.ical,
  );

  server.post('/stripe/webhook', {}, ExternalController.stripeWebhook);

  server.post('/mollie/webhook', {}, ExternalController.mollieWebhook);

  server.get(
    '/scale/:ident/:api',
    {
      schema: {
        querystring: z.object({
          action: z.string().regex(SCALE_ACTION_REGEX),
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
