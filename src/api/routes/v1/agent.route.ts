import fastifySwagger from '@fastify/swagger';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import httpErrors from 'http-errors';

import { url } from '../../../config/environment.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { mapToolError } from '../../adapters/tool_error.adapter.js';
import { agentAuthHook } from '../../hooks/agent_auth.hook.js';
import {
  executeWizBeeTool,
  wizBeeToolDefinitions,
} from '../../modules/wizbee_tools.module.js';
import { permissiveJsonResponseSchema } from '../../schemas/common.schema.js';

export default async function routes(
  instance: FastifyInstance,
  _options: unknown,
) {
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
        response: { 200: permissiveJsonResponseSchema },
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
        response: { 200: permissiveJsonResponseSchema },
      },
      handler: async (request, _reply) => {
        const user = request.session?.user;
        if (!user) {
          throw httpErrors.Unauthorized();
        }
        const context = {
          userId: user.user_id,
          beeId: user.bee_id,
          rank: user.rank,
        };
        const result = await executeWizBeeTool(
          KyselyServer.getInstance().db,
          toolDef.name,
          request.body,
          context,
        );

        if (
          result &&
          typeof result === 'object' &&
          (result as { ok?: unknown }).ok === false
        ) {
          const error =
            (result as { error?: Record<string, unknown> }).error ?? {};
          throw mapToolError(error);
        }

        return result;
      },
    });
  }
}
