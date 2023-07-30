import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@/config/constants.config';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import RearingDetailController from '@/api/controllers/rearing_detail.controller';

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
    RearingDetailController.get,
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
    RearingDetailController.patch,
  );

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: z.object({
          job: z.string(),
        }),
      },
    },
    RearingDetailController.post,
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
    RearingDetailController.batchDelete,
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
    RearingDetailController.batchGet,
  );
  done();
}
