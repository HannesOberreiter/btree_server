import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ROLES } from '../../../config/constants.config.js';
import LlmController from '../../controllers/llm.controller.js';
import { Guard } from '../../hooks/guard.hook.js';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(10000),
});

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/token',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
    },
    LlmController.listTokens,
  );

  server.post(
    '/token',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: z.object({
          provider: z.enum(['openai', 'mistral']),
          access_token: z.string().min(1).max(512),
        }),
      },
    },
    LlmController.saveToken,
  );

  server.delete(
    '/token/:provider',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        params: z.object({
          provider: z.enum(['openai', 'mistral']),
        }),
      },
    },
    LlmController.deleteToken,
  );

  server.post(
    '/chat',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
      schema: {
        body: z.object({
          provider: z.enum(['openai', 'mistral']),
          messages: z.array(messageSchema).min(1).max(50),
        }),
      },
    },
    LlmController.chatHandler,
  );

  server.post(
    '/chat/stream',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
      schema: {
        body: z.object({
          provider: z.enum(['openai', 'mistral']),
          messages: z.array(messageSchema).min(1).max(50),
        }),
      },
    },
    LlmController.chatStreamHandler,
  );

  done();
}
