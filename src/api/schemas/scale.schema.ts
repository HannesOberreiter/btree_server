import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';

export const getParamsSchema = z.object({ id: numberSchema.optional() });
export type GetParams = z.infer<typeof getParamsSchema>;

export const patchBodySchema = z.object({
  ids: z.array(numberSchema),
  data: z.object({}).loose(),
});
export type PatchBody = z.infer<typeof patchBodySchema>;

export const postBodySchema = z
  .object({
    name: z.string().min(1).max(45).trim(),
    hive_id: z.number(),
  })
  .loose();
export type PostBody = z.infer<typeof postBodySchema>;

export const deleteParamsSchema = z.object({
  id: z.string(),
});
export type DeleteParams = z.infer<typeof deleteParamsSchema>;
