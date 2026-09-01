import fastifyFormbody from '@fastify/formbody';
import {
  hostHeaderValidation,
  originValidation,
} from '@modelcontextprotocol/fastify';
import { toNodeHandler } from '@modelcontextprotocol/node';
import {
  buildOAuthProtectedResourceMetadata,
  createMcpHandler,
  type OAuthMetadata,
} from '@modelcontextprotocol/server';
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
} from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ENVIRONMENT } from '../../config/constants.config.js';
import { env, mcp } from '../../config/environment.config.js';
import McpOAuthController from '../controllers/mcp_oauth.controller.js';
import { Guard } from '../hooks/guard.hook.js';
import { authenticateMcpRequest } from '../hooks/mcp_auth.hook.js';
import { createBtreeMcpServer } from '../modules/mcp.module.js';
import { permissiveJsonResponseSchema } from '../schemas/common.schema.js';
import {
  mcpConnectionParamsSchema,
  mcpConnectionsResponseSchema,
  mcpOAuthAuthorizeQuerySchema,
  mcpOAuthConsentRequestSchema,
  mcpOAuthRegistrationRequestSchema,
  mcpOAuthTokenRequestSchema,
  mcpRevocationResponseSchema,
} from '../schemas/mcp_oauth.schema.js';

const oauthMetadata: OAuthMetadata = {
  issuer: mcp.issuer,
  authorization_endpoint: `${mcp.issuer}/api/v1/mcp/oauth/authorize`,
  token_endpoint: `${mcp.issuer}/api/v1/mcp/oauth/token`,
  registration_endpoint: `${mcp.issuer}/api/v1/mcp/oauth/register`,
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
  code_challenge_methods_supported: ['S256'],
  token_endpoint_auth_methods_supported: [
    'none',
    'client_secret_basic',
    'client_secret_post',
  ],
  scopes_supported: [mcp.scope],
  authorization_response_iss_parameter_supported: true,
};

const protectedResourceMetadata = buildOAuthProtectedResourceMetadata({
  oauthMetadata,
  resourceServerUrl: new URL(mcp.resourceUrl),
  scopesSupported: [mcp.scope],
  resourceName: 'b.tree Beekeeping Manager',
  dangerouslyAllowInsecureIssuerUrl:
    env !== ENVIRONMENT.production && mcp.issuer.startsWith('http://'),
});

const mcpHandler = createMcpHandler(
  ({ authInfo }) => createBtreeMcpServer(authInfo),
  {
    legacy: 'stateless',
    responseMode: 'auto',
  },
);
const nodeHandler = toNodeHandler(mcpHandler);

function setOAuthTokenResponseHeaders(
  _request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
) {
  reply.header('Cache-Control', 'no-store');
  reply.header('Pragma', 'no-cache');
  done();
}

export default async function mcpRoutes(instance: FastifyInstance) {
  await instance.register(fastifyFormbody);

  instance.addHook('onRequest', hostHeaderValidation(mcp.allowedHosts));

  const mcpRateLimit = instance.rateLimit({
    max: 120,
    timeWindow: '1 minute',
  });
  const registrationRateLimit = instance.rateLimit({
    max: 10,
    timeWindow: '1 hour',
  });
  const tokenRateLimit = instance.rateLimit({
    max: 30,
    timeWindow: '1 minute',
  });
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/.well-known/oauth-protected-resource/api/v1/mcp',
    { schema: { response: { 200: permissiveJsonResponseSchema } } },
    async () => protectedResourceMetadata,
  );
  server.get(
    '/.well-known/oauth-protected-resource',
    { schema: { response: { 200: permissiveJsonResponseSchema } } },
    async () => protectedResourceMetadata,
  );
  server.get(
    '/.well-known/oauth-authorization-server',
    { schema: { response: { 200: permissiveJsonResponseSchema } } },
    async () => oauthMetadata,
  );

  server.get(
    '/api/v1/mcp/connections',
    {
      onRequest: Guard.authorize(),
      schema: { response: { 200: mcpConnectionsResponseSchema } },
    },
    McpOAuthController.connections,
  );
  server.delete(
    '/api/v1/mcp/connections/:tokenFamily',
    {
      onRequest: Guard.authorize(),
      schema: {
        params: mcpConnectionParamsSchema,
        response: { 200: mcpRevocationResponseSchema },
      },
    },
    McpOAuthController.revokeConnection,
  );
  server.delete(
    '/api/v1/mcp/connections',
    {
      onRequest: Guard.authorize(),
      schema: { response: { 200: mcpRevocationResponseSchema } },
    },
    McpOAuthController.revokeConnections,
  );

  server.post(
    '/api/v1/mcp/oauth/register',
    {
      onRequest: registrationRateLimit,
      bodyLimit: 32 * 1024,
      attachValidation: true,
      schema: {
        body: mcpOAuthRegistrationRequestSchema,
        response: { 201: permissiveJsonResponseSchema },
      },
    },
    McpOAuthController.register,
  );
  server.get(
    '/api/v1/mcp/oauth/authorize',
    {
      attachValidation: true,
      schema: { querystring: mcpOAuthAuthorizeQuerySchema },
    },
    McpOAuthController.authorize,
  );
  server.post(
    '/api/v1/mcp/oauth/authorize',
    {
      bodyLimit: 16 * 1024,
      attachValidation: true,
      schema: { body: mcpOAuthConsentRequestSchema },
    },
    McpOAuthController.consent,
  );
  server.post(
    '/api/v1/mcp/oauth/token',
    {
      onRequest: [tokenRateLimit, setOAuthTokenResponseHeaders],
      bodyLimit: 32 * 1024,
      attachValidation: true,
      schema: {
        body: mcpOAuthTokenRequestSchema,
        response: { 200: permissiveJsonResponseSchema },
      },
    },
    McpOAuthController.token,
  );

  instance.all(
    '/api/v1/mcp',
    {
      onRequest: [originValidation(mcp.allowedOrigins), mcpRateLimit],
      bodyLimit: 1024 * 1024,
    },
    async (request, reply) => {
      if (!(await authenticateMcpRequest(request, reply))) return;
      reply.hijack();
      await nodeHandler(request.raw, reply.raw, request.body);
    },
  );

  instance.addHook('onClose', async () => {
    await mcpHandler.close();
  });
}
