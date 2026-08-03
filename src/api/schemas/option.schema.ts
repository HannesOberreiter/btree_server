import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';
import { jsonDateSchema } from './common.schema.js';

export const optionTableSchema = z.enum([
  'charge_types',
  'hive_sources',
  'hive_types',
  'feed_types',
  'harvest_types',
  'checkup_types',
  'queen_matings',
  'queen_races',
  'treatment_diseases',
  'treatment_types',
  'treatment_vets',
  'wax_products',
  'wax_origin_types',
]);
export const optionTableParamsSchema = z.object({ table: optionTableSchema });

export const optionOrderFieldSchema = z.enum([
  'id',
  'name',
  'favorite',
  'modus',
  'created_at',
  'updated_at',
]);
export const optionListQuerySchema = z.object({
  order: z
    .union([optionOrderFieldSchema, z.array(optionOrderFieldSchema)])
    .optional(),
  direction: z
    .union([z.enum(['asc', 'desc']), z.array(z.enum(['asc', 'desc']))])
    .optional(),
  modus: z.boolean().nullable().optional(),
});

export const optionValuesSchema = z.object({
  name: z.string().min(1).max(45).trim().optional(),
  modus: z.boolean().optional(),
  favorite: z.boolean().optional(),
  unit: z.string().max(45).nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
});

export const patchBodySchema = z.object({
  ids: z.array(numberSchema),
  data: optionValuesSchema,
});

export const postBodySchema = optionValuesSchema.extend({
  name: z.string().min(1).max(45).trim(),
});

export const updateStatusBodySchema = z.object({
  ids: z.array(numberSchema),
  status: z.boolean(),
});

export const updateFavoriteBodySchema = z.object({
  ids: z.array(numberSchema),
});

export const batchDeleteBodySchema = z.object({
  ids: z.array(numberSchema),
});

export const batchGetBodySchema = z.object({
  ids: z.array(numberSchema),
});

const decimalResponseSchema = z.union([z.string(), z.number()]).nullable();
const chargeStockResponseSchema = z
  .object({
    sum: decimalResponseSchema,
    sum_in: decimalResponseSchema,
    sum_out: decimalResponseSchema,
    type_id: z.number().nullable(),
    user_id: z.number().nullable(),
  })
  .nullable();

export const optionResponseSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  modus: z.boolean().nullable(),
  favorite: z.boolean().nullable(),
  created_at: jsonDateSchema.nullable(),
  updated_at: jsonDateSchema.nullable(),
  user_id: z.number().nullable(),
  unit: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  stock: chargeStockResponseSchema.optional(),
});
export const optionListResponseSchema = z.array(optionResponseSchema);

export type OptionTableParams = z.infer<typeof optionTableParamsSchema>;
export type OptionTable = z.infer<typeof optionTableSchema>;
export type OptionOrderField = z.infer<typeof optionOrderFieldSchema>;
export type OptionListQuery = z.infer<typeof optionListQuerySchema>;
export type OptionValues = z.infer<typeof optionValuesSchema>;
export type PatchBody = z.infer<typeof patchBodySchema>;
export type PostBody = z.infer<typeof postBodySchema>;
export type UpdateStatusBody = z.infer<typeof updateStatusBodySchema>;
export type UpdateFavoriteBody = z.infer<typeof updateFavoriteBodySchema>;
export type BatchDeleteBody = z.infer<typeof batchDeleteBodySchema>;
export type BatchGetBody = z.infer<typeof batchGetBodySchema>;
