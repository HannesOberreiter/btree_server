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
const waxInventoryCountResponseSchema = z.object({
  id: z.number(),
  lot_id: z.number(),
  lot_code: z.string(),
  product_id: z.number().nullable(),
  product_name: z.string().nullable(),
  ledger_quantity_kg: z.number(),
  counted_quantity_kg: z.number(),
  adjustment_kg: z.number(),
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
  inventory_counts: z.array(waxInventoryCountResponseSchema),
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
  as_of: z.iso.date().optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(500).optional(),
});
export const waxOperationListQuerySchema = waxListQuerySchema
  .omit({ as_of: true })
  .extend({
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

const waxOperationCreateTypeSchema = z.enum([
  'production',
  'purchase',
  'processing',
  'contract_processing',
  'use',
  'sale',
]);
export const waxOperationCreateSchema = z.object({
  date: z.iso.date(),
  type: waxOperationCreateTypeSchema,
  counterparty: z.string().trim().max(255).nullable().optional(),
  reference: z.string().trim().max(255).nullable().optional(),
  url: z.string().trim().max(512).nullable().optional(),
  note: optionalText,
  origin_type_id: numberSchema.nullable().optional(),
  hive_ids: z.array(numberSchema).max(1000).default([]),
  inputs: z.array(inputLineSchema).max(100).default([]),
  outputs: z.array(outputLineSchema).max(100).default([]),
});

const countedQuantitySchema = z.number().min(0).max(1_000_000).multipleOf(0.01);
export const waxInventoryCreateSchema = z
  .object({
    date: z.iso.date(),
    reference: z.string().trim().max(255).nullable().optional(),
    note: z.string().trim().min(1).max(2000),
    counts: z
      .array(
        z.object({
          lot_id: numberSchema,
          counted_quantity_kg: countedQuantitySchema,
        }),
      )
      .max(100)
      .default([]),
    opening_stocks: z
      .array(
        z.object({
          code: z.string().trim().min(1).max(100).optional(),
          product_id: numberSchema,
          counted_quantity_kg: countedQuantitySchema.min(0.01),
        }),
      )
      .max(100)
      .default([]),
  })
  .refine((body) => body.counts.length + body.opening_stocks.length > 0, {
    message: 'At least one inventory count is required',
  });
export const waxOperationParamsSchema = z.object({ id: numberSchema });

export type WaxListQuery = z.infer<typeof waxListQuerySchema>;
export type WaxOperationListQuery = z.infer<typeof waxOperationListQuerySchema>;
export type WaxOperationCreateBody = z.infer<typeof waxOperationCreateSchema>;
export type WaxOperationWriteBody = Omit<WaxOperationCreateBody, 'type'> & {
  type: WaxOperationCreateBody['type'] | 'correction';
};
export type WaxInventoryCreateBody = z.infer<typeof waxInventoryCreateSchema>;
