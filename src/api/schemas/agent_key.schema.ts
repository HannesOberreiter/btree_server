import { z } from 'zod';

export const createBodySchema = z.object({
  label: z.string().max(100).optional(),
  valid_to: z.string().nullable().optional(),
});
export type CreateBody = z.infer<typeof createBodySchema>;

export const removeParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type RemoveParams = z.infer<typeof removeParamsSchema>;
