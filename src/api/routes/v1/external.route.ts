import fastifyFormbody from '@fastify/formbody';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { KyselyServer } from '../../../servers/kysely.server.js';
import { ingestExternalScaleReading } from '../../adapters/scale_data.adapter.js';
import ExternalController from '../../controllers/external.controller.js';
import { Validator } from '../../hooks/validator.hook.js';
import {
  permissiveJsonResponseSchema,
  compatibilityQuerySchema,
} from '../../schemas/common.schema.js';
import {
  externalCalendarParamsSchema,
  externalScaleParamsSchema,
  externalScaleQuerySchema,
  mollieWebhookBodySchema,
} from '../../schemas/external.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  const db = KyselyServer.getInstance().db;

  server.register(fastifyFormbody);

  server.get(
    '/ical/:source/:api',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        params: externalCalendarParamsSchema,
      },
      preHandler: Validator.handleSource,
    },
    ExternalController.ical,
  );

  server.post(
    '/mollie/webhook',
    {
      schema: {
        body: mollieWebhookBodySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
    },
    ExternalController.mollieWebhook,
  );

  server.get(
    '/scale/:ident/:api',
    {
      schema: {
        params: externalScaleParamsSchema,
        querystring: externalScaleQuerySchema,
      },
    },
    async (request) =>
      ingestExternalScaleReading(db, request.params, request.query),
  );

  done();
}
