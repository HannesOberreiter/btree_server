import { Guard } from '../../hooks/guard.hook.js';
import { ROLES } from '../../../config/constants.config.js';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import RearingController from '../../controllers/rearing.controller.js';
import { numberSchema } from '../../utils/zod.util.js';

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
    RearingController.get,
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
    RearingController.patch,
  );

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: z
          .object({
            detail_id: z.number(),
            type_id: z.number(),
            date: z.string(),
          })
          .passthrough(),
      },
    },
    RearingController.post,
  );

  server.patch(
    '/date',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: z.object({
          ids: z.array(numberSchema),
          start: z.string(),
        }),
      },
    },
    RearingController.updateDate,
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
    RearingController.batchDelete,
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
    RearingController.batchGet,
  );

  done();
}
