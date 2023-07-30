import { Guard } from '@/api/middlewares/guard.middleware';
import { ROLES } from '@/config/constants.config';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import DropboxController from '@/api/controllers/dropbox.controller';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/',
    { preHandler: Guard.authorize([ROLES.admin]) },
    DropboxController.get,
  );
  server.delete(
    '/:id?',
    { preHandler: Guard.authorize([ROLES.admin]) },
    DropboxController.delete,
  );
  server.get(
    '/auth/:code',
    { preHandler: Guard.authorize([ROLES.admin]) },
    DropboxController.auth,
  );
  server.get(
    '/token',
    { preHandler: Guard.authorize([ROLES.admin, ROLES.user]) },
    DropboxController.token,
  );
  done();
}
