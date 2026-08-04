import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';
import { actorResponseSchema, jsonDateSchema } from './common.schema.js';

export const waxOperationTypeSchema = z.enum([
  'production',
  'purchase',
  'processing',
  'contract_processing',
  'use',
  'sale',
  'correction',
]);

const optionalText = z.string().trim().max(2000).nullable().optional();
const waxLineResponseSchema = z.object({
  id: z.number(),
  lot_id: z.number(),
  direction: z.enum(['input', 'output']),
  quantity_kg: z.number(),
  lot_code: z.string(),
  product_id: z.number().nullable(),
  product_name: z.string().nullable(),
});
const waxHiveResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  apiary_id: z.number().nullable(),
  apiary_name: z.string().nullable(),
});

export const waxOperationResponseSchema = z.object({
  id: z.number(),
  date: jsonDateSchema,
  type: waxOperationTypeSchema,
  counterparty: z.string().nullable(),
  reference: z.string().nullable(),
  url: z.string().nullable(),
  note: z.string().nullable(),
  origin_type_id: z.number().nullable(),
  reversal_of_id: z.number().nullable(),
  created_at: jsonDateSchema.nullable(),
  updated_at: jsonDateSchema.nullable(),
  origin_type_name: z.string().nullable(),
  input_kg: z.number(),
  output_kg: z.number(),
  difference_kg: z.number(),
  lines: z.array(waxLineResponseSchema),
  hives: z.array(waxHiveResponseSchema),
  creator: actorResponseSchema.optional(),
  editor: actorResponseSchema.optional(),
});

export const waxLotResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  note: z.string().nullable(),
  product_id: z.number().nullable(),
  product_name: z.string().nullable(),
  created_by_operation_id: z.number().nullable(),
  reference: z.string().nullable(),
  stock_kg: z.number(),
  created_at: jsonDateSchema.nullable(),
  updated_at: jsonDateSchema.nullable(),
});

export const waxListQuerySchema = z.object({
  q: z.string().trim().optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(500).optional(),
});
export const waxOperationListQuerySchema = waxListQuerySchema.extend({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  type: waxOperationTypeSchema.optional(),
});
export const waxOperationListResponseSchema = z.object({
  results: z.array(waxOperationResponseSchema),
  total: z.number(),
});
export const waxLotListResponseSchema = z.object({
  results: z.array(waxLotResponseSchema),
  total: z.number(),
});

const inputLineSchema = z.object({
  lot_id: numberSchema,
  quantity_kg: z.number().min(0.01).max(1_000_000).multipleOf(0.01),
});
const outputLineSchema = z
  .object({
    lot_id: numberSchema.optional(),
    code: z.string().trim().min(1).max(100).optional(),
    product_id: numberSchema.optional(),
    note: optionalText,
    quantity_kg: z.number().min(0.01).max(1_000_000).multipleOf(0.01),
  })
  .refine((line) => line.lot_id || line.product_id, {
    message: 'Existing lot or product is required',
    path: ['lot_id'],
  });

export const waxOperationCreateSchema = z.object({
  date: z.iso.date(),
  type: waxOperationTypeSchema,
  counterparty: z.string().trim().max(255).nullable().optional(),
  reference: z.string().trim().max(255).nullable().optional(),
  url: z.string().trim().max(512).nullable().optional(),
  note: optionalText,
  origin_type_id: numberSchema.nullable().optional(),
  hive_ids: z.array(numberSchema).max(1000).default([]),
  inputs: z.array(inputLineSchema).max(100).default([]),
  outputs: z.array(outputLineSchema).max(100).default([]),
});
export const waxOperationParamsSchema = z.object({ id: numberSchema });

export type WaxListQuery = z.infer<typeof waxListQuerySchema>;
export type WaxOperationListQuery = z.infer<typeof waxOperationListQuerySchema>;
export type WaxOperationCreateBody = z.infer<typeof waxOperationCreateSchema>;
