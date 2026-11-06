import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';
import { actorResponseSchema, jsonDateSchema } from './common.schema.js';

const nullableString = z.string().nullable().optional();
const nullableNumber = z.number().nullable().optional();
const nullableDate = jsonDateSchema.nullable().optional();

export const apiaryResponseSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  description: nullableString,
  latitude: z.number(),
  longitude: z.number(),
  elevation: nullableNumber,
  note: nullableString,
  url: nullableString,
  modus: z.boolean().optional(),
  deleted: z.boolean().optional(),
  deleted_at: nullableDate,
  user_id: nullableNumber,
  bee_id: nullableNumber,
  edit_id: nullableNumber,
  created_at: nullableDate,
  updated_at: nullableDate,
  hive_count: z
    .looseObject({
      id: z.number(),
      apiary_name: z.string(),
      count: z.number(),
      grouphivescount: z.number(),
    })
    .nullable()
    .optional(),
  creator: actorResponseSchema.optional(),
  editor: actorResponseSchema.optional(),
});

export const apiaryPaginatedResponseSchema = z.object({
  results: z.array(apiaryResponseSchema),
  total: z.number(),
});

export const apiaryDetailResponseSchema = apiaryResponseSchema.extend({
  firstMovedate: z
    .looseObject({
      id: z.number(),
      date: jsonDateSchema,
      apiary_id: nullableNumber,
      hive_id: nullableNumber,
    })
    .nullable()
    .optional(),
  sameLocation: z.array(
    z.looseObject({
      id: z.number(),
      name: z.string(),
    }),
  ),
  hives: z.array(
    z.looseObject({
      id: z.number(),
      name: z.string(),
      position: nullableNumber,
      queen_name: nullableString,
      queen_modus: z.boolean().nullable().optional(),
      mark_colour: nullableString,
    }),
  ),
});

const orderDirectionSchema = z.enum(['asc', 'desc', 'ASC', 'DESC']);
export const apiaryOrderFieldSchema = z.enum([
  'id',
  'name',
  'modus',
  'hive_count.count',
  'created_at',
  'updated_at',
  'deleted_at',
]);

export const apiaryListQuerySchema = z.object({
  order: z
    .union([apiaryOrderFieldSchema, z.array(apiaryOrderFieldSchema)])
    .optional(),
  direction: z
    .union([orderDirectionSchema, z.array(orderDirectionSchema)])
    .optional(),
  offset: z.number().optional(),
  limit: z.number().optional(),
  modus: z.boolean().nullable().optional(),
  deleted: z.boolean().optional(),
  q: z.union([z.string(), z.number()]).optional(),
  details: z.boolean().optional(),
});

export const apiaryIdParamsSchema = z.object({
  id: numberSchema,
});

const numericInputSchema = z
  .union([z.number(), z.string().regex(/^-?(?:\d+\.?\d*|\.\d+)$/)])
  .transform(Number);

export const apiaryValuesSchema = z.object({
  name: z.string().min(1).max(45).optional(),
  description: z.string().max(512).optional(),
  latitude: numericInputSchema.pipe(z.number().min(-90).max(90)).optional(),
  longitude: numericInputSchema.pipe(z.number().min(-180).max(180)).optional(),
  elevation: numericInputSchema
    .pipe(z.number().int().min(-500).max(9000))
    .nullable()
    .optional(),
  note: z.string().max(2000).optional(),
  url: z.string().max(512).optional(),
  modus: z.boolean().optional(),
  deleted: z.boolean().optional(),
  deleted_at: z.iso.datetime().nullable().optional(),
});

export const apiaryCreateSchema = apiaryValuesSchema.extend({
  name: z.string().min(3).max(45),
});

export const apiaryBatchUpdateSchema = z.object({
  ids: z.array(numberSchema),
  data: apiaryValuesSchema,
});

export const apiaryIdsSchema = z.object({
  ids: z.array(numberSchema),
});

export const apiaryBatchDeleteQuerySchema = z.looseObject({
  hard: z.union([z.boolean(), z.string(), z.number()]).optional(),
  restore: z.union([z.boolean(), z.string(), z.number()]).optional(),
});

export const apiaryUpdateStatusSchema = z.object({
  ids: z.array(numberSchema),
  status: z.boolean(),
});

export type ApiaryOrderField = z.infer<typeof apiaryOrderFieldSchema>;
export type ApiaryValues = z.infer<typeof apiaryValuesSchema>;
export type ApiaryListQuery = z.infer<typeof apiaryListQuerySchema>;
export type ApiaryIdParams = z.infer<typeof apiaryIdParamsSchema>;
export type ApiaryCreateBody = z.infer<typeof apiaryCreateSchema>;
export type ApiaryBatchUpdateBody = z.infer<typeof apiaryBatchUpdateSchema>;
export type ApiaryIdsBody = z.infer<typeof apiaryIdsSchema>;
export type ApiaryBatchDeleteQuery = z.infer<
  typeof apiaryBatchDeleteQuerySchema
>;
export type ApiaryUpdateStatusBody = z.infer<typeof apiaryUpdateStatusSchema>;
