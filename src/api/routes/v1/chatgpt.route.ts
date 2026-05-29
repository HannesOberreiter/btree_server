import fastifyFormbody from '@fastify/formbody';
import fastifySwagger from '@fastify/swagger';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import httpErrors from 'http-errors';
import { z } from 'zod';

import { url } from '../../../config/environment.config.js';
import AgentOAuthController from '../../controllers/agent_oauth.controller.js';
import {
  executeWizBeeTool,
  wizBeeToolDefinitions,
} from '../../controllers/wizbee.tools.controller.js';
import { chatGptAuthHook } from '../../hooks/chatgpt_auth.hook.js';

export default async function routes(instance: FastifyInstance, _options: any) {
  await instance.register(fastifyFormbody);

  await instance.register(fastifySwagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'b.tree Beekeeping Manager Custom GPT API',
        description:
          'Official b.tree Beekeeping Manager Custom GPT API. ' +
          'OAuth is handled automatically by ChatGPT. ' +
          'Use /openapi.json for tool documentation and POST /tools/{toolName} to execute tools.',
        version: '1.0.0',
      },
      servers: [{ url: `${url}/api/v1/chatgpt`, description: 'Production' }],
      components: {
        securitySchemes: {
          BtreeOAuth: {
            type: 'http',
            scheme: 'bearer',
            description:
              'OAuth token for the official b.tree Beekeeping Manager Custom GPT (starts with btree_oauth_)',
          },
        },
      },
      security: [{ BtreeOAuth: [] }],
    },
    transform: jsonSchemaTransform,
  });

  instance.addHook('preHandler', chatGptAuthHook);

  const chatGptRateLimit = instance.rateLimit({
    max: 60,
    timeWindow: '1 minute',
    keyGenerator: (req) => {
      const auth = req.headers.authorization || '';
      return auth.startsWith('Bearer ') ? auth.slice(7, 31) : req.ip;
    },
  });
  instance.addHook('onRequest', chatGptRateLimit);

  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get('/oauth/authorize', AgentOAuthController.authorize);
  server.post('/oauth/token', AgentOAuthController.token);

  server.get(
    '/openapi.json',
    {
      schema: {
        description:
          'Get the OpenAPI specification for available b.tree Custom GPT tools.',
        tags: ['Discovery'],
      },
    },
    async () => instance.swagger(),
  );

  server.post(
    '/tools/:toolName',
    {
      schema: {
        description:
          'Call one b.tree tool by exact name. Body must match that tool schema from /openapi.json.',
        tags: ['Tools'],
        params: z.object({ toolName: z.string().min(1) }),
        body: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async (request) => {
      const { toolName } = request.params;
      if (!wizBeeToolDefinitions.some((toolDef) => toolDef.name === toolName)) {
        throw httpErrors.NotFound('Unknown tool');
      }

      const user = request.session?.user;
      if (!user) {
        throw httpErrors.Unauthorized();
      }

      const result = await executeWizBeeTool(
        toolName,
        request.body ?? {},
        { userId: user.user_id, beeId: user.bee_id },
      );

      if (
        result &&
        typeof result === 'object' &&
        (result as { ok?: unknown }).ok === false
      ) {
        const err = (result as { error?: Record<string, unknown> }).error ?? {};
        const status = typeof err.status === 'number' ? err.status : 400;
        const message =
          typeof err.message === 'string' && err.message.length > 0
            ? err.message
            : 'Tool execution failed';
        if (status === 401) {
          throw httpErrors.Unauthorized(message);
        }
        if (status === 403) {
          throw httpErrors.Forbidden(message);
        }
        if (status === 404) {
          throw httpErrors.NotFound(message);
        }
        if (status >= 500) {
          throw httpErrors.InternalServerError(message);
        }
        throw httpErrors.BadRequest(message);
      }

      return result;
    },
  );
}
