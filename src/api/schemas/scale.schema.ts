import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';

export const getParamsSchema = z.object({ id: numberSchema.optional() });

export const scaleDataSchema = z.object({
  name: z.string().min(1).max(45).trim().optional(),
  hive_id: numberSchema.optional(),
});

export const patchBodySchema = z.object({
  ids: z.array(numberSchema),
  data: scaleDataSchema,
});

export const postBodySchema = z.object({
  name: z.string().min(1).max(45).trim(),
  hive_id: numberSchema,
});

export const deleteParamsSchema = z.object({ id: numberSchema });

export const scaleResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  hive_id: z.number().nullable(),
  user_id: z.number().nullable(),
  hive: z.looseObject({}).nullable(),
});

export const scaleCreateResponseSchema = scaleResponseSchema.omit({
  hive: true,
});
export const scaleListResponseSchema = z.array(scaleResponseSchema);

export type PatchBody = z.infer<typeof patchBodySchema>;
export type PostBody = z.infer<typeof postBodySchema>;
