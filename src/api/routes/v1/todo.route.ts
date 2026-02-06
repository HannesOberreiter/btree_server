import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ROLES } from '../../../config/constants.config.js';
import TodoController from '../../controllers/todo.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  todoBatchDeleteSchema,
  todoBatchGetSchema,
  todoBatchUpdateSchema,
  todoCreateSchema,
  todoPaginatedResponseSchema,
  todoResponseSchema,
  todoUpdateDateSchema,
  todoUpdateStatusSchema,
} from '../../schemas/todo.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        response: {
          200: todoPaginatedResponseSchema,
        },
      },
    },
    TodoController.get,
  );

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: todoCreateSchema,
        response: {
          200: z.array(z.number()),
        },
      },
    },
    TodoController.post,
  );

  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: todoBatchUpdateSchema,
        response: {
          200: z.number(),
        },
      },
    },
    TodoController.patch,
  );

  server.patch(
    '/status',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: todoUpdateStatusSchema,
        response: {
          200: z.number(),
        },
      },
    },
    TodoController.updateStatus,
  );

  server.patch(
    '/date',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: todoUpdateDateSchema,
        response: {
          200: z.number(),
        },
      },
    },
    TodoController.updateDate,
  );

  server.patch(
    '/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: todoBatchDeleteSchema,
        response: {
          200: z.number(),
        },
      },
    },
    TodoController.batchDelete,
  );

  server.post(
    '/batchGet',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: todoBatchGetSchema,
        response: {
          200: z.array(todoResponseSchema),
        },
      },
    },
    TodoController.batchGet,
  );

  done();
}
