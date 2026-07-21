import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import {
  permissiveJsonResponseSchema,
  compatibilityQuerySchema,
} from '../../schemas/common.schema.js';
import { reportBodySchema } from '../../schemas/root.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: unknown,
  done: () => void,
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
    async () => ({ status: 'ok' }),
  );

  server.post(
    '/report-violation',
    {
      schema: {
        body: reportBodySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
    },
    async (request) => {
      const body = request.body;
      request.log.warn(
        { 'csp-report': body, label: 'CSP violation' },
        body.violation
          ? `CSP Violation: ${JSON.stringify(body.violation)}`
          : 'CSP Violation',
      );
      return { status: 'ok' };
    },
  );

  done();
}
