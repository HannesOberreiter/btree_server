import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@/config/constants.config';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import OptionsController from '@/api/controllers/options.controller';
import { Validator } from '@/api/middlewares/validator.middleware';

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
          ids: z.array(z.number()),
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
          ids: z.array(z.number()),
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
          ids: z.array(z.number()),
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
          ids: z.array(z.number()),
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
          ids: z.array(z.number()),
        }),
      },
    },
    OptionsController.batchGet,
  );

  done();
}
