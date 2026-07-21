import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import RearingStepController from '../../controllers/rearing_step.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  permissiveJsonResponseSchema,
  compatibilityQuerySchema,
} from '../../schemas/common.schema.js';
import {
  postBodySchema,
  deleteParamsSchema,
  updatePositionBodySchema,
} from '../../schemas/rearing_step.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/',
    {
      schema: {
        body: postBodySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin]),
    },
    RearingStepController.post,
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
    RearingStepController.delete,
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
    RearingStepController.updatePosition,
  );

  done();
}
