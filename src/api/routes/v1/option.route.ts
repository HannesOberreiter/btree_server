import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import OptionsController from '../../controllers/options.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import { Validator } from '../../hooks/validator.hook.js';
import {
  permissiveJsonResponseSchema,
  compatibilityQuerySchema,
} from '../../schemas/common.schema.js';
import {
  optionTableParamsSchema,
  patchBodySchema,
  postBodySchema,
  updateStatusBodySchema,
  updateFavoriteBodySchema,
  batchDeleteBodySchema,
  batchGetBodySchema,
} from '../../schemas/option.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  server.get(
    '/:table',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        params: optionTableParamsSchema,
        response: { 200: permissiveJsonResponseSchema },
      },
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
        params: optionTableParamsSchema,
        response: { 200: permissiveJsonResponseSchema },
        body: patchBodySchema,
      },
    },
    OptionsController.patch,
  );

  server.post(
    '/:table',
    {
      schema: {
        body: postBodySchema,
        params: optionTableParamsSchema,
        response: { 200: permissiveJsonResponseSchema },
      },
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
        params: optionTableParamsSchema,
        response: { 200: permissiveJsonResponseSchema },
        body: updateStatusBodySchema,
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
        params: optionTableParamsSchema,
        response: { 200: permissiveJsonResponseSchema },
        body: updateFavoriteBodySchema,
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
        params: optionTableParamsSchema,
        response: { 200: permissiveJsonResponseSchema },
        body: batchDeleteBodySchema,
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
        params: optionTableParamsSchema,
        response: { 200: permissiveJsonResponseSchema },
        body: batchGetBodySchema,
      },
    },
    OptionsController.batchGet,
  );

  done();
}
