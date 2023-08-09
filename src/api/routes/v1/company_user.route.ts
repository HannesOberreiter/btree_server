import { Guard } from '../../middlewares/guard.middleware.js';
import { ROLES } from '../../../config/constants.config.js';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import CompanyUserController from '../../controllers/company_user.controller.js';
import { z } from 'zod';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/user',
    { preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]) },
    CompanyUserController.getUser,
  );
  server.post(
    '/add_user',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: z.object({
          email: z.string().email(),
        }),
      },
    },
    CompanyUserController.addUser,
  );

  server.delete(
    '/remove_user/:id',
    { preHandler: Guard.authorize([ROLES.admin]) },
    CompanyUserController.removeUser,
  );
  server.delete(
    '/:company_id',
    { preHandler: Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]) },
    CompanyUserController.delete,
  );
  server.patch(
    '/:id',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          rank: z.number(),
        }),
      },
    },
    CompanyUserController.patch,
  );

  done();
}
