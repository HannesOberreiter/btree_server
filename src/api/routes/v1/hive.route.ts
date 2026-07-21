import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import HiveController from '../../controllers/hive.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  createHives,
  deleteHives,
  getHiveDetail,
  getHivesByIds,
  listHives,
  updateHivePositions,
  updateHives,
  updateHiveStatus,
} from '../../modules/hive.module.js';
import { permissiveJsonResponseSchema } from '../../schemas/common.schema.js';
import {
  hiveCreateBodySchema,
  hiveDetailResponseSchema,
  hiveIdParamsSchema,
  hiveIdsBodySchema,
  hiveIdsResponseSchema,
  hiveListQuerySchema,
  hiveMutationCountResponseSchema,
  hiveMutationCountsResponseSchema,
  hivePaginatedResponseSchema,
  hivePatchBodySchema,
  hivePositionBodySchema,
  hiveStatusBodySchema,
  hiveTaskQuerySchema,
  hivesResponseSchema,
} from '../../schemas/hive.schema.js';

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
        querystring: hiveListQuerySchema,
        response: { 200: hivePaginatedResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    async (request) =>
      listHives(db, request.session.user.user_id, request.query),
  );
  server.get(
    '/:id',
    {
      schema: {
        querystring: hiveListQuerySchema,
        params: hiveIdParamsSchema,
        response: { 200: hiveDetailResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    async (request) =>
      getHiveDetail(db, request.session.user.user_id, request.params.id),
  );
  server.get(
    '/task/:id',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        params: hiveIdParamsSchema,
        querystring: hiveTaskQuerySchema,
      },
    },
    HiveController.getTasks,
  );
  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: hiveMutationCountResponseSchema },
        body: hivePatchBodySchema,
      },
    },
    async (request) =>
      updateHives(
        db,
        request.session.user.user_id,
        request.session.user.bee_id,
        request.body,
      ),
  );
  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        response: { 200: hiveIdsResponseSchema },
        body: hiveCreateBodySchema,
      },
    },
    async (request) =>
      createHives(
        db,
        request.session.user.user_id,
        request.session.user.bee_id,
        request.body,
      ),
  );
  server.patch(
    '/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        querystring: hiveListQuerySchema,
        response: { 200: hivesResponseSchema },
        body: hiveIdsBodySchema,
      },
    },
    async (request) =>
      deleteHives(
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
        response: { 200: hivesResponseSchema },
        body: hiveIdsBodySchema,
      },
    },
    async (request) =>
      getHivesByIds(db, request.session.user.user_id, request.body.ids),
  );
  server.patch(
    '/status',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        response: { 200: hiveMutationCountResponseSchema },
        body: hiveStatusBodySchema,
      },
    },
    async (request) =>
      updateHiveStatus(
        db,
        request.session.user.user_id,
        request.session.user.bee_id,
        request.body.ids,
        request.body.status,
      ),
  );
  server.patch(
    '/updatePosition',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: hiveMutationCountsResponseSchema },
        body: hivePositionBodySchema,
      },
    },
    async (request) =>
      updateHivePositions(db, request.session.user.user_id, request.body),
  );
  done();
}
