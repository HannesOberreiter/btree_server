import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import UserController from '../../controllers/user.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  permissiveJsonResponseSchema,
  compatibilityQuerySchema,
} from '../../schemas/common.schema.js';
import {
  patchBodySchema,
  deleteBodySchema,
  checkPasswordBodySchema,
  changeCompanyBodySchema,
  deleteFederatedCredentialsParamsSchema,
  addFederatedCredentialsBodySchema,
  deleteRedisSessionParamsSchema,
} from '../../schemas/user.schema.js';

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
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    UserController.get,
  );
  server.patch(
    '/',
    {
      schema: {
        body: patchBodySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    UserController.patch,
  );
  server.patch(
    '/delete',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: deleteBodySchema,
      },
    },
    UserController.delete,
  );

  server.post(
    '/checkpassword',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: checkPasswordBodySchema,
      },
    },
    UserController.checkPassword,
  );

  server.patch(
    '/company',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: changeCompanyBodySchema,
      },
    },
    UserController.changeCompany,
  );

  server.get(
    '/federatedCredentials',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    UserController.getFederatedCredentials,
  );
  server.delete(
    '/federatedCredentials/:id',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
        params: deleteFederatedCredentialsParamsSchema,
      },
    },
    UserController.deleteFederatedCredentials,
  );

  server.post(
    '/federatedCredentials',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: addFederatedCredentialsBodySchema,
      },
    },
    UserController.addFederatedCredentials,
  );

  server.get(
    '/session',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    UserController.getRedisSession,
  );
  server.delete(
    '/session/:id',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
        params: deleteRedisSessionParamsSchema,
      },
    },
    UserController.deleteRedisSession,
  );

  done();
}
