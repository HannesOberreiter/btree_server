import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  createAgentKey,
  listAgentKeys,
  removeAgentKey,
} from '../../modules/agent_key.module.js';
import {
  agentKeyCreateResponseSchema,
  agentKeyDeleteResponseSchema,
  agentKeyListResponseSchema,
  createBodySchema,
  removeParamsSchema,
} from '../../schemas/agent_key.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: unknown,
  done: () => void,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  const db = KyselyServer.getInstance().db;

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: createBodySchema,
        response: { 201: agentKeyCreateResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await createAgentKey(
        db,
        {
          companyId: request.session.user.user_id,
          beeId: request.session.user.bee_id,
        },
        request.body,
      );
      return reply.code(201).send(result);
    },
  );

  server.get(
    '/',
    {
      schema: { response: { 200: agentKeyListResponseSchema } },
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
    },
    async (request) => listAgentKeys(db, request.session.user.bee_id),
  );

  server.delete(
    '/:id',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        params: removeParamsSchema,
        response: { 200: agentKeyDeleteResponseSchema },
      },
    },
    async (request) =>
      removeAgentKey(db, request.params.id, request.session.user.bee_id),
  );

  done();
}
