import { frontend } from '@/config/environment.config';
import fastifyPassport from '@fastify/passport';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import AuthController from '@/api/controllers/auth.controller';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/register',
    {
      schema: {
        body: z.object({
          email: z.string().email(),
          password: z.string().min(6).max(128).trim(),
          name: z.string().min(3).max(128).trim(),
          lang: z.string().min(2).max(2),
          newsletter: z.boolean(),
          source: z.string(),
        }),
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
      schema: {
        querystring: z.object({
          payload: z.string(),
          sig: z.string(),
        }),
      },
    },
    AuthController.discourse,
  );

  server.get(
    '/google/callback',
    {
      preValidation: fastifyPassport.authenticate('google', {
        session: false,
        failureRedirect: frontend + '/visitor/login?error=oauth',
        failureMessage: true,
        scope: ['profile', 'email'],
        assignProperty: 'user',
      }),
    },
    AuthController.google,
  );

  done();
}
