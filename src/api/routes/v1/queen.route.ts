import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ROLES } from '../../../config/constants.config.js';
import QueenController from '../../controllers/queen.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import { Validator } from '../../hooks/validator.hook.js';
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
    QueenController.get,
  );

  server.get(
    '/stats',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    QueenController.getStats,
  );

  server.get(
    '/pedigree/:id',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    QueenController.getPedigree,
  );

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: z
          .object({
            start: z.number().int().min(0).max(10000).optional(),
            repeat: z.number().int().min(0).max(100).optional(),
          })
          .passthrough(),
      },
    },
    QueenController.post,
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
    QueenController.patch,
  );

  server.patch(
    '/status',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: z.object({
          ids: z.array(numberSchema),
          status: z.boolean(),
        }),
      },
    },
    QueenController.updateStatus,
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
    QueenController.batchDelete,
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
    QueenController.batchGet,
  );

  done();
}
