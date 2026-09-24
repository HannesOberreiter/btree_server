import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  createApiary,
  deleteApiaries,
  getApiariesByIds,
  getApiaryDetail,
  listApiaries,
  updateApiaries,
  updateApiaryStatus,
} from '../../modules/apiary.module.js';
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
import { parseResponse } from '../../utils/response.util.js';

export default function routes(
  instance: FastifyInstance,
  _options: unknown,
  done: () => void,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  const db = KyselyServer.getInstance().db;

  server.get(
    '/',
    {
      schema: {
        querystring: apiaryListQuerySchema,
        response: { 200: apiaryPaginatedResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    async (request) => {
      const result = await listApiaries(
        db,
        request.session.user.user_id,
        request.query,
      );
      return parseResponse(apiaryPaginatedResponseSchema, result, request);
    },
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
    async (request) => {
      const result = await getApiaryDetail(
        db,
        request.session.user.user_id,
        request.params.id,
      );
      return parseResponse(apiaryDetailResponseSchema, result, request);
    },
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
    async (request) => {
      const result = await createApiary(
        db,
        request.session.user.user_id,
        request.session.user.bee_id,
        request.body,
      );
      return parseResponse(apiaryResponseSchema, result, request);
    },
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
    async (request) =>
      updateApiaries(
        db,
        request.session.user.user_id,
        request.session.user.bee_id,
        request.body.ids,
        request.body.data,
      ),
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
    async (request) => {
      const result = await deleteApiaries(
        db,
        request.session.user.user_id,
        request.session.user.bee_id,
        request.body.ids,
        {
          hard: Boolean(request.query.hard),
          restore: Boolean(request.query.restore),
        },
      );
      return parseResponse(z.array(apiaryResponseSchema), result, request);
    },
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
    async (request) => {
      const result = await getApiariesByIds(
        db,
        request.session.user.user_id,
        request.body.ids,
      );
      return parseResponse(z.array(apiaryResponseSchema), result, request);
    },
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
    async (request) =>
      updateApiaryStatus(
        db,
        request.session.user.user_id,
        request.session.user.bee_id,
        request.body.ids,
        request.body.status,
      ),
  );

  done();
}
