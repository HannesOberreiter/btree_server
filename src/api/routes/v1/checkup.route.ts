import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import CheckupController from '../../controllers/checkup.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  checkupBatchDeleteQuerySchema,
  checkupBatchUpdateSchema,
  checkupCreateSchema,
  checkupIdsSchema,
  checkupListQuerySchema,
  checkupPaginatedResponseSchema,
  checkupResponseSchema,
  checkupUpdateDateSchema,
  checkupUpdateStatusSchema,
} from '../../schemas/checkup.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: unknown,
  done: () => void,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/',
    {
      schema: {
        querystring: checkupListQuerySchema,
        response: { 200: checkupPaginatedResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    CheckupController.get,
  );

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: checkupCreateSchema,
        response: { 200: z.array(z.number()) },
      },
    },
    CheckupController.post,
  );

  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: checkupBatchUpdateSchema,
        response: { 200: z.number() },
      },
    },
    CheckupController.patch,
  );

  server.patch(
    '/status',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: checkupUpdateStatusSchema,
        response: { 200: z.number() },
      },
    },
    CheckupController.updateStatus,
  );

  server.patch(
    '/date',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: checkupUpdateDateSchema,
        response: { 200: z.number() },
      },
    },
    CheckupController.updateDate,
  );

  server.patch(
    '/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        querystring: checkupBatchDeleteQuerySchema,
        body: checkupIdsSchema,
        response: { 200: z.array(checkupResponseSchema) },
      },
    },
    CheckupController.batchDelete,
  );

  server.post(
    '/batchGet',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: checkupIdsSchema,
        response: { 200: z.array(checkupResponseSchema) },
      },
    },
    CheckupController.batchGet,
  );

  done();
}
