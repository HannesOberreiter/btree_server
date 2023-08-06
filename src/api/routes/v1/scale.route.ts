import { Guard } from '@/api/middlewares/guard.middleware';
import { ROLES } from '@/config/constants.config';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import ScaleController from '@/api/controllers/scale.controller';

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
          ids: z.array(z.number()),
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
