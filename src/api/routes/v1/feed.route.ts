import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  createFeeds,
  getFeedsByIds,
  listFeeds,
  updateFeeds,
} from '../../modules/feed.module.js';
import {
  deleteTasks,
  updateTaskDates,
  updateTaskStatus,
} from '../../modules/task.module.js';
import {
  taskCreateBodySchema,
  taskIdsResponseSchema,
  taskDateBodySchema,
  taskIdsBodySchema,
  taskListQuerySchema,
  taskMutationCountResponseSchema,
  taskPaginatedResponseSchema,
  taskPatchBodySchema,
  taskRowsResponseSchema,
  taskStatusBodySchema,
} from '../../schemas/task.schema.js';

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
        querystring: taskListQuerySchema,
        response: { 200: taskPaginatedResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    async (request) =>
      listFeeds(db, request.session.user.user_id, request.query),
  );
  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: taskIdsResponseSchema },
        body: taskCreateBodySchema,
      },
    },
    async (request) =>
      createFeeds(
        db,
        {
          companyId: request.session.user.user_id,
          beeId: request.session.user.bee_id,
          isLlm: request.session.llm === true,
        },
        request.body,
      ),
  );
  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: taskMutationCountResponseSchema },
        body: taskPatchBodySchema,
      },
    },
    async (request) =>
      updateFeeds(
        db,
        {
          companyId: request.session.user.user_id,
          beeId: request.session.user.bee_id,
          isLlm: request.session.llm === true,
        },
        request.body,
      ),
  );
  server.patch(
    '/status',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: taskMutationCountResponseSchema },
        body: taskStatusBodySchema,
      },
    },
    async (request) =>
      updateTaskStatus(
        db,
        'feeds',
        {
          companyId: request.session.user.user_id,
          beeId: request.session.user.bee_id,
          isLlm: request.session.llm === true,
        },
        request.body.ids,
        request.body.status,
      ),
  );
  server.patch(
    '/date',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: taskMutationCountResponseSchema },
        body: taskDateBodySchema,
      },
    },
    async (request) =>
      updateTaskDates(
        db,
        'feeds',
        {
          companyId: request.session.user.user_id,
          beeId: request.session.user.bee_id,
          isLlm: request.session.llm === true,
        },
        request.body.ids,
        request.body.start,
        request.body.end,
      ),
  );
  server.patch(
    '/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        querystring: taskListQuerySchema,
        response: { 200: taskRowsResponseSchema },
        body: taskIdsBodySchema,
      },
    },
    async (request) =>
      deleteTasks(
        db,
        'feeds',
        {
          companyId: request.session.user.user_id,
          beeId: request.session.user.bee_id,
          isLlm: request.session.llm === true,
        },
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
        response: { 200: taskRowsResponseSchema },
        body: taskIdsBodySchema,
      },
    },
    async (request) =>
      getFeedsByIds(db, request.session.user.user_id, request.body.ids),
  );
  done();
}
