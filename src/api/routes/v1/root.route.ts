import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import RootController from '../../controllers/root.controller.js';
import {
  permissiveJsonResponseSchema,
  compatibilityQuerySchema,
} from '../../schemas/common.schema.js';
import { reportBodySchema } from '../../schemas/root.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/status',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
    },
    RootController.status,
  );

  server.post(
    '/report-violation',
    {
      schema: {
        body: reportBodySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
    },
    RootController.report,
  );

  done();
}
