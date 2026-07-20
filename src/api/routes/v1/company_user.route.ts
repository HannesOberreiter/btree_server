import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import CompanyUserController from '../../controllers/company_user.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  companyChangeResponseSchema,
  companyUserAddResponseSchema,
  companyUserAddSchema,
  companyUserCompanyParamsSchema,
  companyUserIdParamsSchema,
  companyUserRankSchema,
  companyUserResponseSchema,
} from '../../schemas/company_user.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: unknown,
  done: () => void,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/user',
    {
      schema: { response: { 200: z.array(companyUserResponseSchema) } },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    CompanyUserController.getUser,
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
    CompanyUserController.addUser,
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
    CompanyUserController.removeUser,
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
    CompanyUserController.delete,
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
    CompanyUserController.patch,
  );

  done();
}
