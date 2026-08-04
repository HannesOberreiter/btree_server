import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';

const typeDataSchema = z.object({
  name: z.string().min(1).max(45).optional(),
  note: z.string().max(2000).nullable().optional(),
});

export const patchBodySchema = z.object({
  ids: z.array(numberSchema),
  data: typeDataSchema,
});
export type PatchBody = z.infer<typeof patchBodySchema>;

export const postBodySchema = typeDataSchema.extend({
  name: z.string().min(1).max(45),
});
export type PostBody = z.infer<typeof postBodySchema>;

export const batchDeleteBodySchema = z.object({
  ids: z.array(numberSchema),
});
export type BatchDeleteBody = z.infer<typeof batchDeleteBodySchema>;

export const batchGetBodySchema = z.object({
  ids: z.array(numberSchema),
});
export type BatchGetBody = z.infer<typeof batchGetBodySchema>;
