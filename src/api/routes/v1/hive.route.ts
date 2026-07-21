import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import HiveController from '../../controllers/hive.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import { permissiveJsonResponseSchema } from '../../schemas/common.schema.js';
import {
  hiveCreateBodySchema,
  hiveIdParamsSchema,
  hiveIdsBodySchema,
  hiveListQuerySchema,
  hivePatchBodySchema,
  hivePositionBodySchema,
  hiveStatusBodySchema,
  hiveTaskQuerySchema,
} from '../../schemas/hive.schema.js';

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
        querystring: hiveListQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    HiveController.get,
  );
  server.get(
    '/:id',
    {
      schema: {
        querystring: hiveListQuerySchema,
        params: hiveIdParamsSchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    HiveController.getDetail,
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
        response: { 200: permissiveJsonResponseSchema },
        body: hivePatchBodySchema,
      },
    },
    HiveController.patch,
  );
  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: hiveCreateBodySchema,
      },
    },
    HiveController.post,
  );
  server.patch(
    '/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        querystring: hiveListQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
        body: hiveIdsBodySchema,
      },
    },
    HiveController.batchDelete,
  );
  server.post(
    '/batchGet',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: hiveIdsBodySchema,
      },
    },
    HiveController.batchGet,
  );
  server.patch(
    '/status',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: hiveStatusBodySchema,
      },
    },
    HiveController.updateStatus,
  );
  server.patch(
    '/updatePosition',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: hivePositionBodySchema,
      },
    },
    HiveController.updatePosition,
  );
  done();
}
