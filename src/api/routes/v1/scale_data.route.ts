import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@/config/constants.config';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import ScaleDataController from '@/api/controllers/scale_data.controller';
import { numberSchema } from '@/api/utils/zod.util';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  server.get(
    '/',
    { preHandler: Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]) },
    ScaleDataController.get,
  );
  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: z
          .object({
            scale_id: z.number(),
          })
          .passthrough(),
      },
    },
    ScaleDataController.post,
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
    ScaleDataController.patch,
  );

  server.patch(
    '/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: z.object({
          ids: z.array(numberSchema),
        }),
      },
    },
    ScaleDataController.batchDelete,
  );
  server.post(
    '/batchGet',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: z.object({
          ids: z.array(numberSchema),
        }),
      },
    },
    ScaleDataController.batchGet,
  );

  done();
}
