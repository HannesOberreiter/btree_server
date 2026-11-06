import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  createRearingStep,
  deleteRearingStep,
  updateRearingStepPositions,
} from '../../modules/rearing.module.js';
import {
  compatibilityQuerySchema,
  permissiveJsonResponseSchema,
} from '../../schemas/common.schema.js';
import {
  deleteParamsSchema,
  postBodySchema,
  updatePositionBodySchema,
} from '../../schemas/rearing_step.schema.js';
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
      schema: {
        body: postBodySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin]),
    },
    (req) => createRearingStep(db, req.session.user.user_id, req.body),
  );
  server.delete(
    '/:id',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
        params: deleteParamsSchema,
      },
    },
    (req) =>
      deleteRearingStep(db, req.session.user.user_id, Number(req.params.id)),
  );
  server.patch(
    '/updatePosition',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: updatePositionBodySchema,
      },
    },
    (req) => updateRearingStepPositions(db, req.session.user.user_id, req.body),
  );
  done();
}
