import { frontend } from '../../../config/environment.config.js';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import AuthController from '../../controllers/auth.controller.js';
import { Guard } from '../../middlewares/guard.middleware.js';
import { ROLES } from '../../../config/constants.config.js';
import {
  GoogleAuth,
  federatedUser,
} from '../../../services/federated.service.js';
import { buildUserAgent } from '../../utils/auth.util.js';
import { loginCheck } from '../../utils/login.util.js';
import { randomUUID } from 'crypto';
import httpErrors from 'http-errors';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  const google = GoogleAuth.getInstance();

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
    async (req, reply) => {
      let result: federatedUser;
      try {
        const token = req.query.code;
        result = await google.verify(token);
        if (!result.bee_id) {
          if (!result.name && !result.email) {
            throw new Error('No name or email');
          }
          return reply.redirect(
            frontend +
              '/visitor/register?name=' +
              result.name +
              '&email=' +
              result.email +
              '&oauth=google',
          );
        }
      } catch (e) {
        req.log.error({ message: 'Error in google callback', error: e });
        return reply.redirect(frontend + '/visitor/login?error=oauth');
      }

      const userAgent = buildUserAgent(req);

      const { bee_id, user_id, paid, rank } = await loginCheck(
        '',
        '',
        result.bee_id,
      );

      try {
        req['bee_id'] = bee_id;
        await req.session.regenerate();
        req.session.user = {
          bee_id: bee_id,
          user_id: user_id,
          paid: paid,
          rank: rank as any,
          user_agent: userAgent,
          last_visit: new Date(),
          uuid: randomUUID(),
          ip: req.ip,
        };
        await req.session.save();
      } catch (e) {
        req.log.error(e);
        throw httpErrors[500]('Failed to create session');
      }
      reply.redirect(frontend + '/visitor/login');
      return reply;
    },
  );

  done();
}
