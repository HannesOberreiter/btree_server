import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import fastifyFormbody from '@fastify/formbody';

import { z } from 'zod';
import { ROLES } from '../../../config/constants.config.js';
import { AppleAuth, GoogleAuth } from '../../../services/federated.service.js';
import AuthController from '../../controllers/auth.controller.js';
import RootController from '../../controllers/root.controller.js';
import { Guard } from '../../hooks/guard.hook.js';

export const AppleCallbackSchema = z.object({
  code: z.string(),
  id_token: z.string(),
  state: z.string(),
  user: z.union([
    z.string().transform((str, ctx) => {
      try {
        const parsed = JSON.parse(str);
        return z.object({
          email: z.string().email(),
        }).parse(parsed);
      }
      catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid JSON in user field',
        });
        return z.NEVER;
      }
    }),
    z.object({
      email: z.string().email(),
    }),
    z.literal(''), // Accept empty string
    z.null(), // Accept null
  ]).optional(),
  error: z.string().optional(),
});

export const AppleCallbackGETSchema = z.object({
  code: z.string(),
  id_token: z.string().optional(),
  state: z.string(),
  user: z.string().optional(), // Will be URL-encoded JSON string
  error: z.string().optional(),
});

const RegisterBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128).trim(),
  name: z.string().min(3).max(128).trim(),
  lang: z.string().min(2).max(2),
  newsletter: z.boolean(),
  source: z.string(),
  isOAuth: z.boolean().optional(),
});
export type RegisterBody = z.infer<typeof RegisterBodySchema>;

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.register(fastifyFormbody);

  server.post(
    '/register',
    {
      schema: {
        body: RegisterBodySchema,
      },
    },
    AuthController.register,
  );

  server.post(
    '/login',
    {
      schema: {
        body: z.object({
          email: z.string().email(),
          password: z.string().min(6).max(128).trim(),
        }),
      },
    },
    AuthController.login,
  );

  server.get('/logout', {}, AuthController.logout);

  server.patch(
    '/confirm',
    {
      schema: {
        body: z.object({
          confirm: z.string().min(100).max(128),
        }),
      },
    },
    AuthController.confirmMail,
  );

  server.post(
    '/reset',
    {
      schema: {
        body: z.object({
          email: z.string().email(),
        }),
      },
    },
    AuthController.resetRequest,
  );

  server.patch(
    '/reset',
    {
      schema: {
        body: z.object({
          key: z.string().min(100).max(128),
          password: z.string().min(6).max(128).trim(),
        }),
      },
    },
    AuthController.resetPassword,
  );

  server.patch(
    '/unsubscribe',
    {
      schema: {
        body: z.object({
          email: z.string().email(),
        }),
      },
    },
    AuthController.unsubscribeRequest,
  );

  server.get(
    '/discourse',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        querystring: z.object({
          payload: z.string(),
          sig: z.string(),
        }),
      },
    },
    AuthController.discourse,
  );

  server.get('/google', {}, async () => {
    const google = GoogleAuth.getInstance();
    return { url: google.generateAuthUrl() };
  });

  server.get(
    '/google/callback',
    {
      schema: {
        querystring: z.object({
          code: z.string(),
        }),
      },
    },
    AuthController.google,
  );

  server.get('/apple', {}, async () => {
    const apple = AppleAuth.getInstance();
    return { url: apple.generateAuthUrl() };
  });

  server.post(
    '/apple/callback',
    {
      schema: {
        body: AppleCallbackSchema,
      },
    },
    AuthController.apple,
  );

  server.get(
    '/apple/callback',
    {
      schema: {
        querystring: AppleCallbackGETSchema,
      },
    },
    AuthController.apple,
  );

  server.get(
    '/ping',
    { preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]) },
    RootController.status,
  );

  done();
}
