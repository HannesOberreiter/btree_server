import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  createMovedates,
  deleteMovedates,
  getMovedatesByIds,
  listMovedates,
  updateMovedateDates,
  updateMovedates,
} from '../../modules/movedate.module.js';
import { compatibilityQuerySchema } from '../../schemas/common.schema.js';
import {
  batchDeleteBodySchema,
  batchGetBodySchema,
  movedateIdsResponseSchema,
  movedateMutationCountResponseSchema,
  movedatePaginatedResponseSchema,
  movedatesResponseSchema,
  patchBodySchema,
  postBodySchema,
  updateDateBodySchema,
} from '../../schemas/movedate.schema.js';

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
        querystring: compatibilityQuerySchema,
        response: { 200: movedatePaginatedResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    async (request) =>
      listMovedates(db, request.session.user.user_id, request.query),
  );

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: movedateIdsResponseSchema },
        body: postBodySchema,
      },
    },
    async (request) =>
      createMovedates(
        db,
        request.session.user.user_id,
        request.session.user.bee_id,
        request.body,
      ),
  );

  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: movedateMutationCountResponseSchema },
        body: patchBodySchema,
      },
    },
    async (request) =>
      updateMovedates(
        db,
        request.session.user.user_id,
        request.session.user.bee_id,
        request.body,
      ),
  );

  server.patch(
    '/date',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: movedateMutationCountResponseSchema },
        body: updateDateBodySchema,
      },
    },
    async (request) =>
      updateMovedateDates(
        db,
        request.session.user.user_id,
        request.session.user.bee_id,
        request.body.ids,
        request.body.start,
      ),
  );

  server.patch(
    '/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        response: { 200: movedateMutationCountResponseSchema },
        body: batchDeleteBodySchema,
      },
    },
    async (request) =>
      deleteMovedates(db, request.session.user.user_id, request.body.ids),
  );

  server.post(
    '/batchGet',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: movedatesResponseSchema },
        body: batchGetBodySchema,
      },
    },
    async (request) =>
      getMovedatesByIds(db, request.session.user.user_id, request.body.ids),
  );

  done();
}
