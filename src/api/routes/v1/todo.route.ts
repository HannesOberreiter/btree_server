import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  createTodos,
  deleteTodos,
  getTodosByIds,
  listTodos,
  updateTodoDate,
  updateTodos,
  updateTodoStatus,
} from '../../modules/todo.module.js';
import type { TodoActor } from '../../modules/todo.module.js';
import {
  todoBatchDeleteSchema,
  todoBatchGetSchema,
  todoBatchUpdateSchema,
  todoCreateSchema,
  todoListQuerySchema,
  todoPaginatedResponseSchema,
  todoResponseSchema,
  todoUpdateDateSchema,
  todoUpdateStatusSchema,
} from '../../schemas/todo.schema.js';

function actorFromRequest(request: FastifyRequest): TodoActor {
  return {
    beeId: request.session.user.bee_id,
    companyId: request.session.user.user_id,
    isLlm: request.session.llm === true,
  };
}

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
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        querystring: todoListQuerySchema,
        response: { 200: todoPaginatedResponseSchema },
      },
    },
    async (request) => listTodos(db, actorFromRequest(request), request.query),
  );

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: todoCreateSchema,
        response: { 200: z.array(z.number()) },
      },
    },
    async (request) => createTodos(db, actorFromRequest(request), request.body),
  );

  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: todoBatchUpdateSchema,
        response: { 200: z.number() },
      },
    },
    async (request) => updateTodos(db, actorFromRequest(request), request.body),
  );

  server.patch(
    '/status',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: todoUpdateStatusSchema,
        response: { 200: z.number() },
      },
    },
    async (request) =>
      updateTodoStatus(db, actorFromRequest(request), request.body),
  );

  server.patch(
    '/date',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: todoUpdateDateSchema,
        response: { 200: z.number() },
      },
    },
    async (request) =>
      updateTodoDate(db, actorFromRequest(request), request.body),
  );

  server.patch(
    '/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: todoBatchDeleteSchema,
        response: { 200: z.number() },
      },
    },
    async (request) => deleteTodos(db, actorFromRequest(request), request.body),
  );

  server.post(
    '/batchGet',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: todoBatchGetSchema,
        response: { 200: z.array(todoResponseSchema) },
      },
    },
    async (request) =>
      getTodosByIds(db, actorFromRequest(request), request.body),
  );

  done();
}
