import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import HarvestController from '../../controllers/harvest.controller.js';
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
    HarvestController.get,
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
    HarvestController.post,
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
    HarvestController.patch,
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
    HarvestController.updateStatus,
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
    HarvestController.updateDate,
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
    HarvestController.batchDelete,
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
    HarvestController.batchGet,
  );
  done();
}
