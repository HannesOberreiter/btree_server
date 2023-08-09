import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@/config/constants.config';
import { FastifyInstance } from 'fastify';
import ApiaryController from '@/api/controllers/apiary.controller';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { numberSchema } from '@/api/utils/zod.util';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    ApiaryController.get,
  );

  server.get(
    '/:id',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    ApiaryController.getDetail,
  );

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: z
          .object({
            name: z.string().min(3).max(255),
          })
          .passthrough(),
      },
    },
    ApiaryController.post,
  );

  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin]),
    },
    ApiaryController.patch,
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
    ApiaryController.batchDelete,
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
    ApiaryController.batchGet,
  );

  server.patch(
    '/status',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: z.object({
          ids: z.array(numberSchema),
          status: z.boolean(),
        }),
      },
    },
    ApiaryController.updateStatus,
  );

  done();
}
