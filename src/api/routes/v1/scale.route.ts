import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  createScale,
  deleteScale,
  listScales,
  updateScales,
} from '../../modules/scale.module.js';
import {
  deleteParamsSchema,
  getParamsSchema,
  patchBodySchema,
  postBodySchema,
  scaleCreateResponseSchema,
  scaleListResponseSchema,
} from '../../schemas/scale.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: unknown,
  done: () => void,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  const db = KyselyServer.getInstance().db;

  server.get(
    '/:id?',
    {
      schema: {
        params: getParamsSchema,
        response: { 200: scaleListResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
    },
    async (request) =>
      listScales(db, request.session.user.user_id, request.params.id),
  );

  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: patchBodySchema,
        response: { 200: z.number() },
      },
    },
    async (request) =>
      updateScales(db, request.session.user.user_id, request.body),
  );

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: postBodySchema,
        response: { 200: scaleCreateResponseSchema },
      },
    },
    async (request) =>
      createScale(db, request.session.user.user_id, request.body),
  );

  server.delete(
    '/:id',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        params: deleteParamsSchema,
        response: { 200: z.number() },
      },
    },
    async (request) =>
      deleteScale(db, request.session.user.user_id, request.params.id),
  );

  done();
}
