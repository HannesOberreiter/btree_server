import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  createCheckups,
  getCheckupsByIds,
  listCheckups,
  updateCheckups,
} from '../../modules/checkup.module.js';
import {
  deleteTasks,
  updateTaskDates,
  updateTaskStatus,
} from '../../modules/task.module.js';
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
  const db = KyselyServer.getInstance().db;

  server.get(
    '/',
    {
      schema: {
        querystring: checkupListQuerySchema,
        response: { 200: checkupPaginatedResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    async (request) =>
      listCheckups(db, request.session.user.user_id, request.query),
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
    async (request) =>
      createCheckups(
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
        body: checkupBatchUpdateSchema,
        response: { 200: z.number() },
      },
    },
    async (request) =>
      updateCheckups(
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
        body: checkupUpdateStatusSchema,
        response: { 200: z.number() },
      },
    },
    async (request) =>
      updateTaskStatus(
        db,
        'checkups',
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
        body: checkupUpdateDateSchema,
        response: { 200: z.number() },
      },
    },
    async (request) =>
      updateTaskDates(
        db,
        'checkups',
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
        querystring: checkupBatchDeleteQuerySchema,
        body: checkupIdsSchema,
        response: { 200: z.array(checkupResponseSchema) },
      },
    },
    async (request) =>
      deleteTasks(
        db,
        'checkups',
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
        body: checkupIdsSchema,
        response: { 200: z.array(checkupResponseSchema) },
      },
    },
    async (request) =>
      getCheckupsByIds(db, request.session.user.user_id, request.body.ids),
  );

  done();
}
