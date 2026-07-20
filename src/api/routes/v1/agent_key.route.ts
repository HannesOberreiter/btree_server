import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import AgentKeyController from '../../controllers/agent_key.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  permissiveJsonResponseSchema,
  permissiveObjectSchema,
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
        body: z.object({
          label: z.string().max(100).optional(),
          valid_to: z.string().nullable().optional(),
        }),
      },
    },
    AgentKeyController.create,
  );

  server.get(
    '/',
    {
      schema: {
        querystring: permissiveObjectSchema,
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
        querystring: permissiveObjectSchema,
        response: { 200: permissiveJsonResponseSchema },
        params: z.object({
          id: z.coerce.number().int().positive(),
        }),
      },
    },
    AgentKeyController.remove,
  );

  done();
}
