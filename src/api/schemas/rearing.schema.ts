import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';

const rearingDataSchema = z.object({
  name: z.string().max(24).nullable().optional(),
  symbol: z.string().max(24).nullable().optional(),
  larvae: z.number().int().nullable().optional(),
  hatch: z.number().int().nullable().optional(),
  mated: z.number().int().nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
  date: z.string().optional(),
  type_id: numberSchema.nullable().optional(),
  detail_id: numberSchema.nullable().optional(),
});

export const patchBodySchema = z.object({
  ids: z.array(numberSchema),
  data: rearingDataSchema,
});
export type PatchBody = z.infer<typeof patchBodySchema>;

export const postBodySchema = rearingDataSchema.extend({
  detail_id: numberSchema,
  type_id: numberSchema,
  date: z.string(),
});
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
