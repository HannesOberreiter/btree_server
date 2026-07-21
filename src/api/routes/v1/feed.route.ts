import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import FeedController from '../../controllers/feed.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import { permissiveJsonResponseSchema } from '../../schemas/common.schema.js';
import {
  taskCreateBodySchema,
  taskDateBodySchema,
  taskIdsBodySchema,
  taskListQuerySchema,
  taskPatchBodySchema,
  taskStatusBodySchema,
} from '../../schemas/task.schema.js';

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
        querystring: taskListQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    FeedController.get,
  );
  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: taskCreateBodySchema,
      },
    },
    FeedController.post,
  );
  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: taskPatchBodySchema,
      },
    },
    FeedController.patch,
  );
  server.patch(
    '/status',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: taskStatusBodySchema,
      },
    },
    FeedController.updateStatus,
  );
  server.patch(
    '/date',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: taskDateBodySchema,
      },
    },
    FeedController.updateDate,
  );
  server.patch(
    '/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        querystring: taskListQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
        body: taskIdsBodySchema,
      },
    },
    FeedController.batchDelete,
  );
  server.post(
    '/batchGet',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: taskIdsBodySchema,
      },
    },
    FeedController.batchGet,
  );
  done();
}
