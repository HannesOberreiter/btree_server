import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  createScaleData,
  deleteScaleData,
  getScaleDataByIds,
  listScaleData,
  updateScaleData,
} from '../../modules/scale_data.module.js';
import {
  batchDeleteBodySchema,
  batchGetBodySchema,
  patchBodySchema,
  postBodySchema,
  scaleDataBatchResponseSchema,
  scaleDataListQuerySchema,
  scaleDataListResponseSchema,
  scaleDataResponseSchema,
} from '../../schemas/scale_data.schema.js';

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
        querystring: scaleDataListQuerySchema,
        response: { 200: scaleDataListResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
    },
    async (request) =>
      listScaleData(db, request.session.user.user_id, request.query),
  );

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: postBodySchema,
        response: { 200: scaleDataResponseSchema },
      },
    },
    async (request) =>
      createScaleData(db, request.session.user.user_id, request.body),
  );

  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: patchBodySchema,
        response: { 200: z.number() },
      },
    },
    async (request) =>
      updateScaleData(db, request.session.user.user_id, request.body),
  );

  server.patch(
    '/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: batchDeleteBodySchema,
        response: { 200: z.number() },
      },
    },
    async (request) =>
      deleteScaleData(db, request.session.user.user_id, request.body),
  );

  server.post(
    '/batchGet',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: batchGetBodySchema,
        response: { 200: scaleDataBatchResponseSchema },
      },
    },
    async (request) =>
      getScaleDataByIds(db, request.session.user.user_id, request.body),
  );

  done();
}
