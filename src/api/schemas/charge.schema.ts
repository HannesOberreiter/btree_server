import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';
import { jsonDateSchema } from './common.schema.js';

const orderDirectionSchema = z.enum(['asc', 'desc', 'ASC', 'DESC']);
const nullableString = z.string().nullable().optional();
const nullableNumber = z.number().nullable().optional();

const optionResponseSchema = z
  .looseObject({
    id: z.number(),
    name: z.string(),
    unit: nullableString,
    modus: z.boolean().optional(),
    favorite: z.boolean().optional(),
  })
  .nullable()
  .optional();

export const chargeResponseSchema = z.looseObject({
  id: z.number(),
  kind: z.string(),
  date: jsonDateSchema.nullable().optional(),
  bestbefore: jsonDateSchema.nullable().optional(),
  name: nullableString,
  charge: nullableString,
  calibrate: nullableString,
  amount: nullableNumber,
  price: nullableNumber,
  note: nullableString,
  url: nullableString,
  deleted: z.boolean().optional(),
  deleted_at: jsonDateSchema.nullable().optional(),
  created_at: jsonDateSchema.nullable().optional(),
  updated_at: jsonDateSchema.nullable().optional(),
  type_id: nullableNumber,
  user_id: nullableNumber,
  bee_id: nullableNumber,
  edit_id: nullableNumber,
  type: optionResponseSchema,
  creator: z.looseObject({}).nullable().optional(),
  editor: z.looseObject({}).nullable().optional(),
});

export const chargePaginatedResponseSchema = z.object({
  results: z.array(chargeResponseSchema),
  total: z.number(),
});

export const chargeStockResponseSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  unit: nullableString,
  sum: z.union([z.number(), z.string()]).nullable().optional(),
  sum_in: z.union([z.number(), z.string()]).nullable().optional(),
  sum_out: z.union([z.number(), z.string()]).nullable().optional(),
});

export const chargeStockPaginatedResponseSchema = z.object({
  results: z.array(chargeStockResponseSchema),
  total: z.number(),
});

export const chargeListQuerySchema = z.looseObject({
  order: z.union([z.string(), z.array(z.string())]).optional(),
  direction: z
    .union([orderDirectionSchema, z.array(orderDirectionSchema)])
    .optional(),
  offset: z.number().optional(),
  limit: z.number().optional(),
  q: z.union([z.string(), z.number(), z.boolean()]).optional(),
  filters: z.string().optional(),
  deleted: z.boolean().optional(),
});

export const chargeStockQuerySchema = chargeListQuerySchema.omit({
  filters: true,
  deleted: true,
});

export const chargeCreateSchema = z.looseObject({
  kind: z.string(),
  date: z.string().optional(),
  bestbefore: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  charge: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  amount: z.number().nullable().optional(),
  url: z.string().nullable().optional(),
  type_id: numberSchema.nullable().optional(),
  note: z.string().nullable().optional(),
});

export const chargeUpdateDataSchema = z.object({
  kind: z.string().optional(),
  date: z.string().nullable().optional(),
  bestbefore: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  charge: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  amount: z.number().nullable().optional(),
  url: z.string().nullable().optional(),
  type_id: numberSchema.nullable().optional(),
  note: z.string().nullable().optional(),
});

export const chargeBatchUpdateSchema = z.object({
  ids: z.array(numberSchema),
  data: chargeUpdateDataSchema,
});

export const chargeIdsSchema = z.object({
  ids: z.array(numberSchema),
});

export const chargeBatchDeleteQuerySchema = z.looseObject({
  hard: z.union([z.boolean(), z.string(), z.number()]).optional(),
  restore: z.union([z.boolean(), z.string(), z.number()]).optional(),
});

export type ChargeListQuery = z.infer<typeof chargeListQuerySchema>;
export type ChargeStockQuery = z.infer<typeof chargeStockQuerySchema>;
export type ChargeCreateBody = z.infer<typeof chargeCreateSchema>;
export type ChargeBatchUpdateBody = z.infer<typeof chargeBatchUpdateSchema>;
export type ChargeIdsBody = z.infer<typeof chargeIdsSchema>;
export type ChargeBatchDeleteQuery = z.infer<
  typeof chargeBatchDeleteQuerySchema
>;
