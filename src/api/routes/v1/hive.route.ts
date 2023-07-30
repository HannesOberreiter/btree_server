import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@/config/constants.config';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import HiveController from '@/api/controllers/hive.controller';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  server.get(
    '/',
    { preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]) },
    HiveController.get,
  );
  server.get(
    '/:id',
    { preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]) },
    HiveController.getDetail,
  );
  server.get(
    '/task/:id',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        querystring: z.object({
          apiary: z.boolean().optional(),
          year: z.number().optional(),
        }),
      },
    },
    HiveController.getTasks,
  );
  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: z.object({
          ids: z.array(z.number()),
        }),
      },
    },
    HiveController.patch,
  );

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: z.object({
          apiary_id: z.number(),
          start: z.number().min(0).max(10000),
          repeat: z.number().min(0).max(100),
          date: z.string(),
        }),
      },
    },
    HiveController.post,
  );

  server.patch(
    '/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: z.object({
          ids: z.array(z.number()),
        }),
      },
    },
    HiveController.batchDelete,
  );

  server.post(
    '/batchGet',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: z.object({
          ids: z.array(z.number()),
        }),
      },
    },
    HiveController.batchGet,
  );

  server.patch(
    '/status',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: z.object({
          ids: z.array(z.number()),
          status: z.boolean(),
        }),
      },
    },
    HiveController.updateStatus,
  );

  server.patch(
    '/updatePosition',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: z.object({
          data: z
            .object({
              id: z.number(),
              position: z.number(),
            })
            .array(),
        }),
      },
    },
    HiveController.updatePosition,
  );

  done();
}
