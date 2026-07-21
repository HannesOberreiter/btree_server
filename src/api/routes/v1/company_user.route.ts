import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import AuthController from '../../controllers/auth.controller.js';
import UserController from '../../controllers/user.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  addCompanyUser,
  leaveCompany,
  listCompanyUsers,
  removeCompanyUser,
  updateCompanyUserRank,
} from '../../modules/company_user.module.js';
import {
  companyChangeResponseSchema,
  companyUserAddResponseSchema,
  companyUserAddSchema,
  companyUserCompanyParamsSchema,
  companyUserIdParamsSchema,
  companyUserRankSchema,
  companyUserResponseSchema,
} from '../../schemas/company_user.schema.js';
import type { ChangeCompanyBody } from '../../schemas/user.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: unknown,
  done: () => void,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  const db = KyselyServer.getInstance().db;

  server.get(
    '/user',
    {
      schema: { response: { 200: z.array(companyUserResponseSchema) } },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    async (request) => listCompanyUsers(db, request.session.user.user_id),
  );

  server.post(
    '/add_user',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: companyUserAddSchema,
        response: { 200: companyUserAddResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await addCompanyUser(
        db,
        request.session.user.user_id,
        request.session.user.bee_id,
        request.body.email,
      );
      if (!result.created) return { userExists: result.userExists };
      return { ...(await AuthController.resetRequest(request, reply)) };
    },
  );

  server.delete(
    '/remove_user/:id',
    {
      schema: {
        params: companyUserIdParamsSchema,
        response: { 200: z.number() },
      },
      preHandler: Guard.authorize([ROLES.admin]),
    },
    async (request) =>
      removeCompanyUser(db, request.session.user.user_id, request.params.id),
  );

  server.delete(
    '/:company_id',
    {
      schema: {
        params: companyUserCompanyParamsSchema,
        response: { 200: companyChangeResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
    },
    async (request, reply) => {
      const companyId = await leaveCompany(
        db,
        request.session.user.bee_id,
        request.params.company_id,
      );
      (request as FastifyRequest & { body: ChangeCompanyBody }).body = {
        saved_company: companyId,
      };
      return UserController.changeCompany(request, reply);
    },
  );

  server.patch(
    '/:id',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        params: companyUserIdParamsSchema,
        body: companyUserRankSchema,
        response: { 200: z.number() },
      },
    },
    async (request) =>
      updateCompanyUserRank(
        db,
        request.session.user.user_id,
        request.params.id,
        request.body.rank,
      ),
  );

  done();
}
