import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import {
  authorizeDropbox,
  disconnectDropbox,
  getDropboxAuthorizationUrl,
  getDropboxToken,
} from '../../adapters/dropbox.adapter.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  authParamsSchema,
  deleteParamsSchema,
  dropboxAuthorizationResponseSchema,
  dropboxDeleteResponseSchema,
  dropboxTokenResponseSchema,
} from '../../schemas/dropbox.schema.js';

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
      schema: { response: { 200: dropboxAuthorizationResponseSchema } },
      preHandler: Guard.authorize([ROLES.admin]),
    },
    getDropboxAuthorizationUrl,
  );

  server.delete(
    '/:id?',
    {
      schema: {
        params: deleteParamsSchema,
        response: { 200: dropboxDeleteResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin]),
    },
    async (request) => disconnectDropbox(db, request.session.user.user_id),
  );

  server.get(
    '/auth/:code',
    {
      schema: {
        params: authParamsSchema,
        response: { 200: dropboxTokenResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin]),
    },
    async (request) =>
      authorizeDropbox(db, request.session.user.user_id, request.params.code),
  );

  server.get(
    '/token',
    {
      schema: { response: { 200: dropboxTokenResponseSchema } },
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
    },
    async (request) => getDropboxToken(db, request.session.user.user_id),
  );

  done();
}
