import { z } from 'zod';

import { jsonDateSchema } from './common.schema.js';

export const createBodySchema = z.object({
  label: z.string().max(100).optional(),
  valid_to: z.string().nullable().optional(),
});
export type CreateBody = z.infer<typeof createBodySchema>;

export const removeParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type RemoveParams = z.infer<typeof removeParamsSchema>;

export const agentKeyCreateResponseSchema = z.object({
  id: z.number(),
  key: z.string(),
  key_prefix: z.string(),
  label: z.string().nullable(),
  valid_to: jsonDateSchema.nullable(),
  message: z.string(),
});

export const agentKeyListItemSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  bee_id: z.number(),
  key_prefix: z.string(),
  label: z.string().nullable(),
  last_used: z.string().nullable(),
  created_at: z.string(),
  valid_to: z.string().nullable(),
  company_name: z.string().nullable(),
});

export const agentKeyListResponseSchema = z.array(agentKeyListItemSchema);
export const agentKeyDeleteResponseSchema = z.object({ message: z.string() });
