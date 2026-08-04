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
    async (request) =>
      listApiaries(db, request.session.user.user_id, request.query),
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
    async (request) =>
      getApiaryDetail(db, request.session.user.user_id, request.params.id),
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
    async (request) =>
      createApiary(
        db,
        request.session.user.user_id,
        request.session.user.bee_id,
        request.body,
      ),
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
    async (request) =>
      deleteApiaries(
        db,
        request.session.user.user_id,
        request.session.user.bee_id,
        request.body.ids,
        {
          hard: Boolean(request.query.hard),
          restore: Boolean(request.query.restore),
        },
      ),
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
    async (request) =>
      getApiariesByIds(db, request.session.user.user_id, request.body.ids),
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
