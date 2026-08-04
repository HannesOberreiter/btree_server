import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';
import { actorResponseSchema, jsonDateSchema } from './common.schema.js';

const orderDirectionSchema = z.enum(['asc', 'desc', 'ASC', 'DESC']);
const nullableNumber = z.number().nullable().optional();
const nullableString = z.string().nullable().optional();

export const checkupResponseSchema = z.looseObject({
  id: z.number(),
  date: jsonDateSchema.nullable().optional(),
  enddate: jsonDateSchema.nullable().optional(),
  queen: z.boolean().nullable().optional(),
  queencells: z.boolean().nullable().optional(),
  eggs: z.boolean().nullable().optional(),
  capped_brood: z.boolean().nullable().optional(),
  brood: nullableNumber,
  pollen: nullableNumber,
  comb: nullableNumber,
  temper: nullableNumber,
  calm_comb: nullableNumber,
  swarm: nullableNumber,
  varroa: nullableNumber,
  strong: nullableNumber,
  temperature: nullableNumber,
  weight: nullableNumber,
  time: nullableString,
  broodframes: nullableNumber,
  honeyframes: nullableNumber,
  foundation: nullableNumber,
  emptyframes: nullableNumber,
  note: nullableString,
  url: nullableString,
  done: z.boolean().optional(),
  deleted: z.boolean().optional(),
  deleted_at: jsonDateSchema.nullable().optional(),
  created_at: jsonDateSchema.nullable().optional(),
  updated_at: jsonDateSchema.nullable().optional(),
  user_id: nullableNumber,
  hive_id: nullableNumber,
  type_id: nullableNumber,
  bee_id: nullableNumber,
  edit_id: nullableNumber,
  type: z.looseObject({}).nullable().optional(),
  hive: z
    .looseObject({
      id: z.number(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  checkup_apiary: z
    .looseObject({
      apiary_id: z.number(),
      apiary_name: z.string(),
    })
    .nullable()
    .optional(),
  creator: actorResponseSchema.optional(),
  editor: actorResponseSchema.optional(),
});

export const checkupPaginatedResponseSchema = z.object({
  results: z.array(checkupResponseSchema),
  total: z.number(),
});

export const checkupListQuerySchema = z.looseObject({
  order: z.union([z.string(), z.array(z.string())]).optional(),
  direction: z
    .union([orderDirectionSchema, z.array(orderDirectionSchema)])
    .optional(),
  offset: z.number().optional(),
  limit: z.number().optional(),
  q: z.union([z.string(), z.number(), z.boolean()]).optional(),
  filters: z.string().optional(),
  deleted: z.boolean().optional(),
  done: z.boolean().nullable().optional(),
});

export const checkupDataSchema = z.object({
  date: z.string().optional(),
  enddate: z.string().nullable().optional(),
  queen: z.boolean().nullable().optional(),
  queencells: z.boolean().nullable().optional(),
  eggs: z.boolean().nullable().optional(),
  capped_brood: z.boolean().nullable().optional(),
  brood: nullableNumber,
  pollen: nullableNumber,
  comb: nullableNumber,
  temper: nullableNumber,
  calm_comb: nullableNumber,
  swarm: nullableNumber,
  varroa: nullableNumber,
  strong: nullableNumber,
  temperature: nullableNumber,
  weight: nullableNumber,
  time: nullableString,
  broodframes: nullableNumber,
  honeyframes: nullableNumber,
  foundation: nullableNumber,
  emptyframes: nullableNumber,
  note: nullableString,
  url: nullableString,
  done: z.boolean().optional(),
  deleted: z.boolean().optional(),
  type_id: numberSchema.nullable().optional(),
});

export const checkupCreateSchema = checkupDataSchema.extend({
  hive_ids: z.array(numberSchema),
  date: z.string(),
  interval: z.number().min(0).max(365),
  repeat: z.number().min(0).max(15),
});

export const checkupUpdateDataSchema = checkupDataSchema.partial();

export const checkupBatchUpdateSchema = z.object({
  ids: z.array(numberSchema),
  data: checkupUpdateDataSchema,
});

export const checkupIdsSchema = z.object({
  ids: z.array(numberSchema),
});

export const checkupUpdateStatusSchema = z.object({
  ids: z.array(numberSchema),
  status: z.boolean(),
});

export const checkupUpdateDateSchema = z.object({
  ids: z.array(numberSchema),
  start: z.string(),
  end: z.string(),
});

export const checkupBatchDeleteQuerySchema = z.looseObject({
  hard: z.union([z.boolean(), z.string(), z.number()]).optional(),
  restore: z.union([z.boolean(), z.string(), z.number()]).optional(),
});

export type CheckupListQuery = z.infer<typeof checkupListQuerySchema>;
export type CheckupCreateBody = z.infer<typeof checkupCreateSchema>;
export type CheckupBatchUpdateBody = z.infer<typeof checkupBatchUpdateSchema>;
export type CheckupIdsBody = z.infer<typeof checkupIdsSchema>;
export type CheckupUpdateStatusBody = z.infer<typeof checkupUpdateStatusSchema>;
export type CheckupUpdateDateBody = z.infer<typeof checkupUpdateDateSchema>;
export type CheckupBatchDeleteQuery = z.infer<
  typeof checkupBatchDeleteQuerySchema
>;
