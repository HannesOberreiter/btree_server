import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import ApiaryController from '../../controllers/apiary.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  apiaryBatchDeleteQuerySchema,
  apiaryBatchUpdateSchema,
  apiaryCreateSchema,
  apiaryDetailResponseSchema,
  apiaryIdParamsSchema,
  apiaryIdsSchema,
  apiaryListQuerySchema,
  apiaryPaginatedResponseSchema,
  apiaryResponseSchema,
  apiaryUpdateStatusSchema,
} from '../../schemas/apiary.schema.js';

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
        querystring: apiaryListQuerySchema,
        response: { 200: apiaryPaginatedResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    ApiaryController.get,
  );

  server.get(
    '/:id',
    {
      schema: {
        params: apiaryIdParamsSchema,
        response: { 200: apiaryDetailResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    ApiaryController.getDetail,
  );

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: apiaryCreateSchema,
        response: { 200: apiaryResponseSchema },
      },
    },
    ApiaryController.post,
  );

  server.patch(
    '/',
    {
      schema: {
        body: apiaryBatchUpdateSchema,
        response: { 200: z.number() },
      },
      preHandler: Guard.authorize([ROLES.admin]),
    },
    ApiaryController.patch,
  );

  server.patch(
    '/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        querystring: apiaryBatchDeleteQuerySchema,
        body: apiaryIdsSchema,
        response: { 200: z.array(apiaryResponseSchema) },
      },
    },
    ApiaryController.batchDelete,
  );

  server.post(
    '/batchGet',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: apiaryIdsSchema,
        response: { 200: z.array(apiaryResponseSchema) },
      },
    },
    ApiaryController.batchGet,
  );

  server.patch(
    '/status',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: apiaryUpdateStatusSchema,
        response: { 200: z.number() },
      },
    },
    ApiaryController.updateStatus,
  );

  done();
}
