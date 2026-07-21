import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import ScaleController from '../../controllers/scale.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  permissiveJsonResponseSchema,
  compatibilityQuerySchema,
} from '../../schemas/common.schema.js';
import {
  getParamsSchema,
  patchBodySchema,
  postBodySchema,
  deleteParamsSchema,
} from '../../schemas/scale.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/:id?',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        params: getParamsSchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
    },
    ScaleController.get,
  );
  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: patchBodySchema,
      },
    },
    ScaleController.patch,
  );

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: postBodySchema,
      },
    },
    ScaleController.post,
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
    ScaleController.delete,
  );

  done();
}
