import { Guard } from '../../hooks/guard.hook.js';
import { ROLES } from '../../../config/constants.config.js';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import DropboxController from '../../controllers/dropbox.controller.js';

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
