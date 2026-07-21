import fastifyFormbody from '@fastify/formbody';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import { AppleAuth, GoogleAuth } from '../../../services/federated.service.js';
import AuthController from '../../controllers/auth.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  appleCallbackGetSchema,
  appleCallbackSchema,
  confirmBodySchema,
  discourseQuerySchema,
  discourseResponseSchema,
  emailBodySchema,
  emailResponseSchema,
  googleCallbackQuerySchema,
  loginBodySchema,
  loginResponseSchema,
  logoutResponseSchema,
  oauthUrlResponseSchema,
  registerBodySchema,
  registerResponseSchema,
  resetPasswordBodySchema,
  resetRequestResponseSchema,
  statusResponseSchema,
} from '../../schemas/auth.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: unknown,
  done: () => void,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.register(fastifyFormbody);

  server.post(
    '/register',
    {
      schema: {
        body: registerBodySchema,
        response: { 200: registerResponseSchema },
      },
    },
    AuthController.register,
  );

  server.post(
    '/login',
    {
      schema: {
        body: loginBodySchema,
        response: { 200: loginResponseSchema },
      },
    },
    AuthController.login,
  );

  server.get(
    '/logout',
    {
      schema: { response: { 200: logoutResponseSchema } },
    },
    AuthController.logout,
  );

  server.patch(
    '/confirm',
    {
      schema: {
        body: confirmBodySchema,
        response: { 200: emailResponseSchema },
      },
    },
    AuthController.confirmMail,
  );

  server.post(
    '/reset',
    {
      schema: {
        body: emailBodySchema,
        response: { 200: resetRequestResponseSchema },
      },
    },
    AuthController.resetRequest,
  );

  server.patch(
    '/reset',
    {
      schema: {
        body: resetPasswordBodySchema,
        response: { 200: emailResponseSchema },
      },
    },
    AuthController.resetPassword,
  );

  server.patch(
    '/unsubscribe',
    {
      schema: {
        body: emailBodySchema,
        response: { 200: emailResponseSchema },
      },
    },
    AuthController.unsubscribeRequest,
  );

  server.get(
    '/discourse',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        querystring: discourseQuerySchema,
        response: { 200: discourseResponseSchema },
      },
    },
    AuthController.discourse,
  );

  server.get(
    '/google',
    {
      schema: { response: { 200: oauthUrlResponseSchema } },
    },
    async () => {
      const google = GoogleAuth.getInstance();
      return { url: google.generateAuthUrl() };
    },
  );

  server.get(
    '/google/callback',
    {
      schema: { querystring: googleCallbackQuerySchema },
    },
    AuthController.google,
  );

  server.get(
    '/apple',
    {
      schema: { response: { 200: oauthUrlResponseSchema } },
    },
    async () => {
      const apple = AppleAuth.getInstance();
      return { url: apple.generateAuthUrl() };
    },
  );

  server.post(
    '/apple/callback',
    {
      schema: { body: appleCallbackSchema },
    },
    AuthController.apple,
  );

  server.get(
    '/apple/callback',
    {
      schema: { querystring: appleCallbackGetSchema },
    },
    AuthController.apple,
  );

  server.get(
    '/ping',
    {
      schema: { response: { 200: statusResponseSchema } },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    async () => ({ status: 'ok' }),
  );

  done();
}
