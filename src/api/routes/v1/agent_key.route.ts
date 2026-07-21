import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import AgentKeyController from '../../controllers/agent_key.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  createBodySchema,
  removeParamsSchema,
} from '../../schemas/agent_key.schema.js';
import {
  permissiveJsonResponseSchema,
  compatibilityQuerySchema,
} from '../../schemas/common.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: createBodySchema,
      },
    },
    AgentKeyController.create,
  );

  server.get(
    '/',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
    },
    AgentKeyController.list,
  );

  server.delete(
    '/:id',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
        params: removeParamsSchema,
      },
    },
    AgentKeyController.remove,
  );

  done();
}
