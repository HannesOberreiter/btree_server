import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';

export const scaleDataOrderFieldSchema = z.enum([
  'id',
  'scale.name',
  'scale.hive.name',
  'datetime',
  'weight',
  'temp1',
  'temp2',
  'humidity',
  'rain',
  'note',
]);

export const scaleDataListQuerySchema = z
  .object({
    order: z
      .union([scaleDataOrderFieldSchema, z.array(scaleDataOrderFieldSchema)])
      .optional(),
    direction: z
      .union([z.enum(['asc', 'desc']), z.array(z.enum(['asc', 'desc']))])
      .optional(),
    offset: numberSchema.optional(),
    limit: numberSchema.optional(),
    q: z.union([z.string(), z.number()]).optional(),
    filters: z.string().optional(),
  })
  .loose();

const decimalInputSchema = z
  .union([z.number(), z.string().regex(/^-?(?:\d+\.?\d*|\.\d+)$/)])
  .transform(Number);

export const scaleDataValuesSchema = z.object({
  datetime: z.string().optional(),
  weight: decimalInputSchema.nullable().optional(),
  temp1: decimalInputSchema.nullable().optional(),
  temp2: decimalInputSchema.nullable().optional(),
  rain: decimalInputSchema.nullable().optional(),
  humidity: decimalInputSchema.nullable().optional(),
  note: z.string().max(300).nullable().optional(),
  scale_id: numberSchema.optional(),
});

export const postBodySchema = scaleDataValuesSchema.extend({
  datetime: z.string(),
  scale_id: numberSchema,
});

export const patchBodySchema = z.object({
  ids: z.array(numberSchema),
  data: scaleDataValuesSchema.partial(),
});

export const batchDeleteBodySchema = z.object({ ids: z.array(numberSchema) });
export const batchGetBodySchema = z.object({ ids: z.array(numberSchema) });

const decimalResponseSchema = z.union([z.string(), z.number()]).nullable();
const hiveResponseSchema = z
  .object({
    id: z.number(),
    name: z.string().nullable(),
    grouphive: z.number().nullable(),
    position: z.number().nullable(),
    note: z.string().nullable(),
    modus: z.boolean().nullable(),
    modus_date: z.string().nullable(),
    deleted: z.boolean().nullable(),
    deleted_at: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
    user_id: z.number().nullable(),
    bee_id: z.number().nullable(),
    edit_id: z.number().nullable(),
    type_id: z.number().nullable(),
    source_id: z.number().nullable(),
  })
  .nullable();

const scaleResponseSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  hive_id: z.number().nullable(),
  user_id: z.number().nullable(),
  hive: hiveResponseSchema,
});

export const scaleDataResponseSchema = z.object({
  id: z.number(),
  datetime: z.string().nullable(),
  weight: decimalResponseSchema,
  temp1: decimalResponseSchema,
  temp2: decimalResponseSchema,
  rain: decimalResponseSchema,
  humidity: decimalResponseSchema,
  note: z.string().nullable(),
  scale_id: z.number().nullable(),
  scale: scaleResponseSchema.optional(),
});

export const scaleDataListResponseSchema = z.object({
  results: z.array(scaleDataResponseSchema),
  total: z.number(),
});
export const scaleDataBatchResponseSchema = z.array(scaleDataResponseSchema);

export type ScaleDataListQuery = z.infer<typeof scaleDataListQuerySchema>;
export type ScaleDataOrderField = z.infer<typeof scaleDataOrderFieldSchema>;
export type PostBody = z.infer<typeof postBodySchema>;
export type PatchBody = z.infer<typeof patchBodySchema>;
export type BatchDeleteBody = z.infer<typeof batchDeleteBodySchema>;
export type BatchGetBody = z.infer<typeof batchGetBodySchema>;
