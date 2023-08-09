import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@/config/constants.config';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import OptionsController from '@/api/controllers/options.controller';
import { Validator } from '@/api/middlewares/validator.middleware';
import { numberSchema } from '@/api/utils/zod.util';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  server.get(
    '/:table',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.handleOption,
    },
    OptionsController.get,
  );
  server.patch(
    '/:table',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      preValidation: Validator.handleOption,
      schema: {
        body: z.object({
          ids: z.array(numberSchema),
          data: z.object({}).passthrough(),
        }),
      },
    },
    OptionsController.patch,
  );

  server.post(
    '/:table',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      preValidation: Validator.handleOption,
    },
    OptionsController.post,
  );

  server.patch(
    '/:table/status',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      preValidation: Validator.handleOption,
      schema: {
        body: z.object({
          ids: z.array(numberSchema),
          status: z.boolean(),
        }),
      },
    },
    OptionsController.updateStatus,
  );

  server.patch(
    '/:table/favorite',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      preValidation: Validator.handleOption,
      schema: {
        body: z.object({
          ids: z.array(numberSchema),
        }),
      },
    },
    OptionsController.updateFavorite,
  );

  server.patch(
    '/:table/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      preValidation: Validator.handleOption,
      schema: {
        body: z.object({
          ids: z.array(numberSchema),
        }),
      },
    },
    OptionsController.batchDelete,
  );

  server.post(
    '/:table/batchGet',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
      preValidation: Validator.handleOption,
      schema: {
        body: z.object({
          ids: z.array(numberSchema),
        }),
      },
    },
    OptionsController.batchGet,
  );

  done();
}
