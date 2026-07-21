import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import QueenController from '../../controllers/queen.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import { Validator } from '../../hooks/validator.hook.js';
import {
  permissiveJsonResponseSchema,
  compatibilityQuerySchema,
} from '../../schemas/common.schema.js';
import {
  getPedigreeParamsSchema,
  postBodySchema,
  patchBodySchema,
  updateStatusBodySchema,
  batchDeleteBodySchema,
  batchGetBodySchema,
} from '../../schemas/queen.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    QueenController.get,
  );

  server.get(
    '/stats',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    QueenController.getStats,
  );

  server.get(
    '/pedigree/:id',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        params: getPedigreeParamsSchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    QueenController.getPedigree,
  );

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: postBodySchema,
      },
    },
    QueenController.post,
  );

  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: patchBodySchema,
      },
    },
    QueenController.patch,
  );

  server.patch(
    '/status',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: updateStatusBodySchema,
      },
    },
    QueenController.updateStatus,
  );

  server.patch(
    '/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
        body: batchDeleteBodySchema,
      },
    },
    QueenController.batchDelete,
  );

  server.post(
    '/batchGet',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: batchGetBodySchema,
      },
    },
    QueenController.batchGet,
  );

  done();
}
