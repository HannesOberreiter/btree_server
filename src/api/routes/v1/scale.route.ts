import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import ScaleController from '../../controllers/scale.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  permissiveJsonResponseSchema,
  permissiveObjectSchema,
} from '../../schemas/common.schema.js';
import { numberSchema } from '../../utils/zod.util.js';

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
        querystring: permissiveObjectSchema,
        params: permissiveObjectSchema,
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
        body: z.object({
          ids: z.array(numberSchema),
          data: z.object({}).loose(),
        }),
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
        body: z
          .object({
            name: z.string().min(1).max(45).trim(),
            hive_id: z.number(),
          })
          .loose(),
      },
    },
    ScaleController.post,
  );

  server.delete(
    '/:id',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        querystring: permissiveObjectSchema,
        response: { 200: permissiveJsonResponseSchema },
        params: z.object({
          id: z.string(),
        }),
      },
    },
    ScaleController.delete,
  );

  done();
}
