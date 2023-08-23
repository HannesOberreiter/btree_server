import { Guard } from '../../hooks/guard.hook.js';
import { ROLES } from '../../../config/constants.config.js';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import ChargeController from '../../controllers/charge.controller.js';
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
    ChargeController.get,
  );

  server.get(
    '/stock',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    ChargeController.getStock,
  );

  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        body: z.object({
          ids: z.array(numberSchema),
          data: z.object({}).passthrough(),
        }),
      },
    },
    ChargeController.patch,
  );

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
    },
    ChargeController.post,
  );

  server.patch(
    '/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: z.object({
          ids: z.array(numberSchema),
        }),
      },
    },
    ChargeController.batchDelete,
  );

  server.post(
    '/batchGet',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
      schema: {
        body: z.object({
          ids: z.array(numberSchema),
        }),
      },
    },
    ChargeController.batchGet,
  );

  done();
}
