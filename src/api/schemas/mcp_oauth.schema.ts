import { z } from 'zod';

import { jsonDateSchema } from './common.schema.js';

export const mcpOAuthRegistrationRequestSchema = z
  .object({
    client_name: z.string().trim().min(1).max(128).optional(),
    redirect_uris: z.array(z.string().min(1).max(2048)).min(1).max(10),
    grant_types: z.array(z.string()).optional(),
    response_types: z.array(z.string()).optional(),
    token_endpoint_auth_method: z
      .enum(['none', 'client_secret_basic', 'client_secret_post'])
      .optional()
      .default('none'),
  })
  .passthrough();

export const mcpOAuthAuthorizeQuerySchema = z
  .object({
    client_id: z.string().min(1).max(128),
    redirect_uri: z.string().min(1).max(2048),
    response_type: z.literal('code'),
    scope: z.string().optional(),
    state: z.string().min(1).max(1024),
    resource: z.string().min(1).max(2048),
    code_challenge: z.string().min(43).max(128),
    code_challenge_method: z.literal('S256'),
  })
  .passthrough();

export const mcpOAuthRedirectQuerySchema = z
  .object({
    client_id: z.string().min(1).max(128),
    redirect_uri: z.string().min(1).max(2048),
    state: z.string().min(1).max(1024),
  })
  .passthrough();

export const mcpOAuthConsentRequestSchema = z.object({
  consent_token: z.string().min(1).max(128),
  decision: z.enum(['approve', 'deny']),
});

export const mcpConnectionParamsSchema = z.object({
  tokenFamily: z.string().regex(/^[A-Za-z0-9_-]{22}$/),
});

export const mcpConnectionResponseSchema = z.object({
  token_family: z.string(),
  client_id: z.string(),
  client_name: z.string(),
  created_at: jsonDateSchema,
  last_used_at: jsonDateSchema.nullable(),
  expires_at: jsonDateSchema,
});

export const mcpConnectionsResponseSchema = z.array(
  mcpConnectionResponseSchema,
);

export const mcpRevocationResponseSchema = z.object({
  revoked: z.number().int().nonnegative(),
});

export const mcpOAuthTokenRequestSchema = z
  .object({
    grant_type: z.enum(['authorization_code', 'refresh_token']),
    client_id: z.string().max(128).optional(),
    client_secret: z.string().max(512).optional(),
    code: z.string().optional(),
    redirect_uri: z.string().max(2048).optional(),
    code_verifier: z.string().min(43).max(128).optional(),
    refresh_token: z.string().optional(),
    resource: z.string().max(2048).optional(),
  })
  .passthrough();
