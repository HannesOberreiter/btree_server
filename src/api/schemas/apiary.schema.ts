import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';
import { jsonDateSchema } from './common.schema.js';

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
  creator: z
    .looseObject({
      email: nullableString,
      username: nullableString,
    })
    .nullable()
    .optional(),
  editor: z
    .looseObject({
      email: nullableString,
      username: nullableString,
    })
    .nullable()
    .optional(),
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

export const apiaryListQuerySchema = z.looseObject({
  order: z.union([z.string(), z.array(z.string())]).optional(),
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

export const apiaryIdParamsSchema = z.looseObject({
  id: z.string(),
});

export const apiaryCreateSchema = z.looseObject({
  name: z.string().min(3).max(255),
});

export const apiaryBatchUpdateSchema = z.looseObject({
  ids: z.array(numberSchema),
  data: z.looseObject({}),
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

export type ApiaryListQuery = z.infer<typeof apiaryListQuerySchema>;
export type ApiaryIdParams = z.infer<typeof apiaryIdParamsSchema>;
export type ApiaryCreateBody = z.infer<typeof apiaryCreateSchema>;
export type ApiaryBatchUpdateBody = z.infer<typeof apiaryBatchUpdateSchema>;
export type ApiaryIdsBody = z.infer<typeof apiaryIdsSchema>;
export type ApiaryBatchDeleteQuery = z.infer<
  typeof apiaryBatchDeleteQuerySchema
>;
export type ApiaryUpdateStatusBody = z.infer<typeof apiaryUpdateStatusSchema>;
