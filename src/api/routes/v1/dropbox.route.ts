import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import DropboxController from '../../controllers/dropbox.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  permissiveJsonResponseSchema,
  compatibilityQuerySchema,
} from '../../schemas/common.schema.js';
import {
  deleteParamsSchema,
  authParamsSchema,
} from '../../schemas/dropbox.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin]),
    },
    DropboxController.get,
  );
  server.delete(
    '/:id?',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        params: deleteParamsSchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin]),
    },
    DropboxController.delete,
  );
  server.get(
    '/auth/:code',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        params: authParamsSchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin]),
    },
    DropboxController.auth,
  );
  server.get(
    '/token',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
    },
    DropboxController.token,
  );
  done();
}
