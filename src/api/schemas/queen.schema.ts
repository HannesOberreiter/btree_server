import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';
import { jsonDateSchema } from './common.schema.js';

const nullableNumber = z.number().nullable().optional();
const nullableString = z.string().nullable().optional();

export const queenResponseSchema = z.looseObject({
  id: z.number(),
  name: nullableString,
  mark_colour: nullableString,
  mother: nullableString,
  date: jsonDateSchema.nullable().optional(),
  move_date: jsonDateSchema.nullable().optional(),
  url: nullableString,
  note: nullableString,
  modus: z.boolean().nullable().optional(),
  modus_date: jsonDateSchema.nullable().optional(),
  deleted: z.boolean().nullable().optional(),
  deleted_at: jsonDateSchema.nullable().optional(),
  created_at: jsonDateSchema.nullable().optional(),
  updated_at: jsonDateSchema.nullable().optional(),
  hive_id: nullableNumber,
  race_id: nullableNumber,
  mating_id: nullableNumber,
  mother_id: nullableNumber,
  user_id: nullableNumber,
  bee_id: nullableNumber,
  edit_id: nullableNumber,
  hive_location: z.looseObject({}).nullable().optional(),
  queen_location: z.looseObject({}).nullable().optional(),
  race: z.looseObject({}).nullable().optional(),
  mating: z.looseObject({}).nullable().optional(),
  own_mother: z.looseObject({}).nullable().optional(),
  creator: z.looseObject({}).nullable().optional(),
  editor: z.looseObject({}).nullable().optional(),
});

export const queenPaginatedResponseSchema = z.object({
  results: z.array(queenResponseSchema),
  total: z.number(),
});
export const queenStatsResponseSchema = z.object({
  results: z.array(z.looseObject({ id: z.number() })),
  total: z.number(),
});
export const queenPedigreeResponseSchema = z.array(
  z.looseObject({ id: z.number(), name: nullableString }),
);

export const getPedigreeParamsSchema = z.object({ id: numberSchema });
export type GetPedigreeParams = z.infer<typeof getPedigreeParamsSchema>;

const queenDataSchema = z.object({
  name: z.string().min(1).max(36).optional(),
  mark_colour: z.string().max(24).nullable().optional(),
  mother: z.string().max(36).nullable().optional(),
  date: z.string().nullable().optional(),
  move_date: z.string().nullable().optional(),
  url: z.string().max(512).nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
  modus: z.boolean().optional(),
  modus_date: z.string().nullable().optional(),
  hive_id: z.union([numberSchema, z.literal('empty'), z.null()]).optional(),
  race_id: numberSchema.nullable().optional(),
  mating_id: numberSchema.nullable().optional(),
  mother_id: numberSchema.nullable().optional(),
});

export const postBodySchema = queenDataSchema.extend({
  name: z.string().min(1).max(36),
  hive_id: z.union([numberSchema, z.array(numberSchema)]).optional(),
  start: z.number().int().min(0).max(10000).optional(),
  repeat: z.number().int().min(0).max(100).optional(),
});
export type PostBody = z.infer<typeof postBodySchema>;

export const patchBodySchema = z.object({
  ids: z.array(numberSchema),
  data: queenDataSchema.partial(),
});
export type PatchBody = z.infer<typeof patchBodySchema>;

export const updateStatusBodySchema = z.object({
  ids: z.array(numberSchema),
  status: z.boolean(),
});
export type UpdateStatusBody = z.infer<typeof updateStatusBodySchema>;

export const batchDeleteBodySchema = z.object({
  ids: z.array(numberSchema),
});
export type BatchDeleteBody = z.infer<typeof batchDeleteBodySchema>;

export const batchGetBodySchema = z.object({
  ids: z.array(numberSchema),
});
export type BatchGetBody = z.infer<typeof batchGetBodySchema>;
