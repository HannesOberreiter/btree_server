import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';
import { jsonDateSchema } from './common.schema.js';

const nullableNumber = z.number().nullable().optional();
const nullableString = z.string().nullable().optional();
const nullableDate = jsonDateSchema.nullable().optional();

export const movedateResponseSchema = z.looseObject({
  id: z.number(),
  date: nullableDate,
  apiary_id: nullableNumber,
  hive_id: nullableNumber,
  bee_id: nullableNumber,
  edit_id: nullableNumber,
  created_at: nullableDate,
  updated_at: nullableDate,
  apiary: z
    .looseObject({ id: z.number(), name: z.string() })
    .nullable()
    .optional(),
  hive: z
    .looseObject({ id: z.number(), name: z.string() })
    .nullable()
    .optional(),
  creator: z
    .looseObject({ email: nullableString, username: nullableString })
    .nullable()
    .optional(),
  editor: z
    .looseObject({ email: nullableString, username: nullableString })
    .nullable()
    .optional(),
  movedate_previous_apiary: z.looseObject({}).nullable().optional(),
});
export const movedatePaginatedResponseSchema = z.object({
  results: z.array(movedateResponseSchema),
  total: z.number(),
});
export const movedatesResponseSchema = z.array(movedateResponseSchema);
export const movedateIdsResponseSchema = z.array(z.number());
export const movedateMutationCountResponseSchema = z.number();

export const postBodySchema = z.object({
  hive_ids: z.array(numberSchema),
  apiary_id: z.number(),
  date: z.string(),
});
export type PostBody = z.infer<typeof postBodySchema>;

export const patchBodySchema = z.object({
  ids: z.array(numberSchema),
  data: z.object({
    apiary_id: numberSchema.optional(),
    hive_id: numberSchema.optional(),
    date: z.string().optional(),
  }),
});
export type PatchBody = z.infer<typeof patchBodySchema>;

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
