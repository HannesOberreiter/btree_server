import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import UserController from '../../controllers/user.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  permissiveJsonResponseSchema,
  permissiveObjectSchema,
  permissiveRequestSchema,
} from '../../schemas/common.schema.js';

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
        querystring: permissiveObjectSchema,
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
        body: permissiveRequestSchema,
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
        body: z.object({
          password: z.string().trim(),
        }),
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
        body: z.object({
          password: z.string().trim(),
        }),
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
        body: z
          .object({
            saved_company: z.number(),
          })
          .loose(),
      },
    },
    UserController.changeCompany,
  );

  server.get(
    '/federatedCredentials',
    {
      schema: {
        querystring: permissiveObjectSchema,
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
        querystring: permissiveObjectSchema,
        response: { 200: permissiveJsonResponseSchema },
        params: z.object({
          id: z.coerce.number().int().positive(),
        }),
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
        body: z.object({
          email: z.email(),
          provider: z.enum(['google', 'apple']).default('google'),
        }),
      },
    },
    UserController.addFederatedCredentials,
  );

  server.get(
    '/session',
    {
      schema: {
        querystring: permissiveObjectSchema,
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
        querystring: permissiveObjectSchema,
        response: { 200: permissiveJsonResponseSchema },
        params: z.object({
          id: z.string(),
        }),
      },
    },
    UserController.deleteRedisSession,
  );

  done();
}
