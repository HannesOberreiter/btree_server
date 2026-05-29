import fastifyFormbody from '@fastify/formbody';
import fastifySwagger from '@fastify/swagger';
import type { FastifyInstance, FastifyRequest } from 'fastify';
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

type OpenApiPathItem = {
  post: {
    tags: string[];
    description: string;
    requestBody: {
      required: boolean;
      content: {
        'application/json': {
          schema: Record<string, unknown>;
        };
      };
    };
    responses: {
      200: {
        description: string;
      };
    };
  };
};

function buildChatGptToolSpec() {
  const paths = wizBeeToolDefinitions.reduce<Record<string, OpenApiPathItem>>(
    (toolPaths, toolDef) => {
      toolPaths[`/tools/${toolDef.name}`] = {
        post: {
          tags: ['Tools'],
          description: toolDef.description,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: z.toJSONSchema(toolDef.parameters) as Record<
                  string,
                  unknown
                >,
              },
            },
          },
          responses: {
            200: {
              description: 'Tool result',
            },
          },
        },
      };
      return toolPaths;
    },
    {},
  );

  return {
    openapi: '3.1.0',
    info: {
      title: 'b.tree Beekeeping Manager Tool Reference',
      description:
        'Tool reference for the official b.tree Beekeeping Manager Custom GPT. ' +
        'This document describes available tool names and payload schemas. ' +
        'Execute tools through the Custom GPT action callBtreeTool, using the same toolName and request body.',
      version: '1.0.0',
    },
    servers: [{ url: `${url}/api/v1/chatgpt` }],
    paths,
  };
}

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
    async () => buildChatGptToolSpec(),
  );

  async function callTool(toolName: string, body: unknown, request: FastifyRequest) {
    if (!wizBeeToolDefinitions.some((toolDef) => toolDef.name === toolName)) {
      throw httpErrors.NotFound('Unknown tool');
    }

    const user = request.session?.user;
    if (!user) {
      throw httpErrors.Unauthorized();
    }

    const result = await executeWizBeeTool(toolName, body ?? {}, {
      userId: user.user_id,
      beeId: user.bee_id,
    });

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
  }

  server.post(
    '/tool',
    {
      schema: {
        description:
          'Call one b.tree tool by exact name. body must match that tool schema from /openapi.json.',
        tags: ['Tools'],
        body: z.object({
          toolName: z.string().min(1),
          body: z.record(z.string(), z.unknown()).optional(),
        }),
      },
    },
    async (request) => {
      const { toolName, body } = request.body;
      return callTool(toolName, body ?? {}, request);
    },
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
      return callTool(toolName, request.body ?? {}, request);
    },
  );
}
