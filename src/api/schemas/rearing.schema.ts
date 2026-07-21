import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';

export const patchBodySchema = z.object({
  ids: z.array(numberSchema),
  data: z.object({}).loose(),
});
export type PatchBody = z.infer<typeof patchBodySchema>;

export const postBodySchema = z
  .object({
    detail_id: z.number(),
    type_id: z.number(),
    date: z.string(),
  })
  .loose();
export type PostBody = z.infer<typeof postBodySchema>;

export const updateDateBodySchema = z.object({
  ids: z.array(numberSchema),
  start: z.string(),
});
export type UpdateDateBody = z.infer<typeof updateDateBodySchema>;

export const batchDeleteBodySchema = z.object({
  ids: z.array(numberSchema),
});
export type BatchDeleteBody = z.infer<typeof batchDeleteBodySchema>;

export const batchGetBodySchema = z.object({
  ids: z.array(numberSchema),
});
export type BatchGetBody = z.infer<typeof batchGetBodySchema>;
