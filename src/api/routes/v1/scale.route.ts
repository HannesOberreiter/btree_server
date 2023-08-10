import { Guard } from '../../hooks/guard.hook.js';
import { ROLES } from '../../../config/constants.config.js';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import ScaleController from '../../controllers/scale.controller.js';
import { numberSchema } from '../../utils/zod.util.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/:id?',
    { preHandler: Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]) },
    ScaleController.get,
  );
  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: z.object({
          ids: z.array(numberSchema),
          data: z.object({}).passthrough(),
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
        body: z
          .object({
            name: z.string().min(1).max(45).trim(),
            hive_id: z.number(),
          })
          .passthrough(),
      },
    },
    ScaleController.post,
  );

  server.delete(
    '/:id',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        params: z.object({
          id: z.string(),
        }),
      },
    },
    ScaleController.delete,
  );

  done();
}
