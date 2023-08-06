import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@/config/constants.config';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import HiveController from '@/api/controllers/hive.controller';
import { booleanParamSchema } from '@/api/utils/zod.util';

const hiveSchema = z.object({
  name: z.string().min(1).max(24).trim(),
  grouphive: z.number().int().optional().default(0),
  position: z.number().int().optional().default(0),
  note: z.string().max(2000).optional(),
  modus: z.boolean().optional(),
  modus_date: z.string().optional(),
  deleted: z.boolean().optional(),
});

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
        params: z.object({
          id: z.coerce.number(),
        }),
        querystring: z.object({
          apiary: booleanParamSchema.optional(),
          year: z.coerce.number().optional(),
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
          data: hiveSchema.partial(),
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
        body: z
          .object({
            apiary_id: z.number(),
            start: z.number().min(0).max(10000),
            repeat: z.number().min(0).max(100),
            date: z.string(),
          })
          .merge(hiveSchema),
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
