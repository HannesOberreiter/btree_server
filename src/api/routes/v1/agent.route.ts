import fastifySwagger from '@fastify/swagger';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import httpErrors from 'http-errors';

import { url } from '../../../config/environment.config.js';
import {
  executeWizBeeTool,
  wizBeeToolDefinitions,
} from '../../controllers/wizbee.tools.controller.js';
import { agentAuthHook } from '../../hooks/agent_auth.hook.js';

export default async function routes(instance: FastifyInstance, _options: any) {
  // Register @fastify/swagger scoped to this plugin (prefix: /v1/agent)
  await instance.register(fastifySwagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'b.tree Agent API',
        description:
          'API for external LLM agents to interact with b.tree beekeeping data. ' +
          'Use b.tree Agent API keys in the Authorization header for custom agents. ' +
          'Agent API keys start with btree_ak_ and can be managed at https://app.btree.at/setting/profile/agent-keys.',
        version: '1.0.0',
      },
      servers: [{ url: `${url}/api/v1/agent`, description: 'Production' }],
      components: {
        securitySchemes: {
          AgentKey: {
            type: 'http',
            scheme: 'bearer',
            description: 'b.tree Agent API key (starts with btree_ak_)',
          },
        },
      },
      security: [{ AgentKey: [] }],
    },
    transform: jsonSchemaTransform,
  });

  // Apply agent auth to ALL routes in this plugin
  instance.addHook('preHandler', agentAuthHook);

  // Agent-specific rate limit: 60 req/min per API key
  // Uses the global @fastify/rate-limit plugin (registered in app.config)
  // via its per-route override — no second plugin registration needed.
  const agentRateLimit = instance.rateLimit({
    max: 60,
    timeWindow: '1 minute',
    keyGenerator: (req) => {
      const auth = req.headers.authorization || '';
      return auth.startsWith('Bearer ') ? auth.slice(7, 23) : req.ip;
    },
  });
  instance.addHook('onRequest', agentRateLimit);

  const server = instance.withTypeProvider<ZodTypeProvider>();

  // GET /openapi.json — serves the auto-generated OpenAPI spec
  server.get(
    '/openapi.json',
    {
      schema: {
        description:
          'Get the OpenAPI specification for all available agent tool endpoints.',
        tags: ['Discovery'],
      },
    },
    async (_request, _reply) => {
      return instance.swagger();
    },
  );

  // Register each WizBee tool as a POST /tools/:toolName endpoint
  for (const toolDef of wizBeeToolDefinitions) {
    server.post(`/tools/${toolDef.name}`, {
      schema: {
        description: toolDef.description,
        tags: ['Tools'],
        body: toolDef.parameters,
      },
      handler: async (request, _reply) => {
        const user = request.session?.user;
        if (!user) {
          throw httpErrors.Unauthorized();
        }
        const context = { userId: user.user_id, beeId: user.bee_id };
        const result = await executeWizBeeTool(
          toolDef.name,
          request.body,
          context,
        );

        // The wizbee tool wrapper returns a structured envelope on failure
        // ({ ok: false, error: {...} }) so the in-process LLM loop can recover.
        // For the public HTTP agent API we translate it back into a standard
        // fastify httpError so external consumers get the canonical
        // { statusCode, error, message } body shape used everywhere else.
        // Hint + suggested_next_tool are attached as `cause` so they're still
        // visible to agents but don't change the error envelope shape.
        if (
          result &&
          typeof result === 'object' &&
          (result as any).ok === false
        ) {
          const err = (result as any).error ?? {};
          const status: number =
            typeof err.status === 'number' ? err.status : 400;
          const message: string =
            typeof err.message === 'string' && err.message.length > 0
              ? err.message
              : 'Tool execution failed';
          const httpErr = (httpErrors as any)[status]
            ? (httpErrors as any)[status](message)
            : httpErrors.BadRequest(message);
          httpErr.cause = {
            code: err.code,
            ...(err.hint && { hint: err.hint }),
            ...(err.suggested_next_tool && {
              suggested_next_tool: err.suggested_next_tool,
            }),
          };
          throw httpErr;
        }

        return result;
      },
    });
  }
}
