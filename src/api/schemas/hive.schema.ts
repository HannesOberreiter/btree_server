import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';
import { compatibilityQuerySchema, jsonDateSchema } from './common.schema.js';

const nullableNumber = z.number().nullable().optional();
const nullableString = z.string().nullable().optional();
const nullableDate = jsonDateSchema.nullable().optional();

const hiveOptionResponseSchema = z
  .looseObject({
    id: z.number(),
    name: nullableString,
    favorite: z.boolean().nullable().optional(),
    modus: z.boolean().nullable().optional(),
    user_id: nullableNumber,
    created_at: nullableDate,
    updated_at: nullableDate,
  })
  .nullable()
  .optional();

const identifierResponseSchema = z
  .looseObject({
    email: nullableString,
    username: nullableString,
  })
  .nullable()
  .optional();

const movedateResponseSchema = z
  .looseObject({
    id: z.number(),
    date: nullableDate,
    apiary_id: nullableNumber,
    hive_id: nullableNumber,
    bee_id: nullableNumber,
    edit_id: nullableNumber,
    created_at: nullableDate,
    updated_at: nullableDate,
  })
  .nullable()
  .optional();

const hiveLocationResponseSchema = z
  .looseObject({
    apiary_id: z.number(),
    apiary_name: nullableString,
    user_id: nullableNumber,
    move_id: z.number(),
    hive_id: z.number(),
    hive_name: nullableString,
    hive_modus: z.boolean().nullable().optional(),
    hive_deleted: z.boolean().nullable().optional(),
    movedate: movedateResponseSchema,
  })
  .nullable()
  .optional();

const queenResponseSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  date: nullableDate,
  move_date: nullableDate,
  mother: nullableString,
  mother_id: nullableNumber,
  mark_colour: nullableString,
  modus: z.boolean().nullable().optional(),
  modus_date: nullableDate,
  deleted: z.boolean().nullable().optional(),
  deleted_at: nullableDate,
  note: nullableString,
  url: nullableString,
  hive_id: nullableNumber,
  race_id: nullableNumber,
  mating_id: nullableNumber,
  user_id: nullableNumber,
  bee_id: nullableNumber,
  edit_id: nullableNumber,
  created_at: nullableDate,
  updated_at: nullableDate,
  race: hiveOptionResponseSchema,
  mating: hiveOptionResponseSchema,
});

const queenLocationResponseSchema = z
  .looseObject({
    hive_id: z.number(),
    hive_name: nullableString,
    queen_id: nullableNumber,
    queen_name: nullableString,
    queen_modus: z.boolean().nullable().optional(),
    queen_modus_date: nullableDate,
    queen_move_date: nullableDate,
    queen_mark_colour: nullableString,
    queen: queenResponseSchema.nullable().optional(),
  })
  .nullable()
  .optional();

export const hiveResponseSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  grouphive: nullableNumber,
  position: nullableNumber,
  note: nullableString,
  modus: z.boolean().nullable().optional(),
  modus_date: nullableDate,
  deleted: z.boolean().nullable().optional(),
  deleted_at: nullableDate,
  user_id: nullableNumber,
  bee_id: nullableNumber,
  edit_id: nullableNumber,
  type_id: nullableNumber,
  source_id: nullableNumber,
  created_at: nullableDate,
  updated_at: nullableDate,
  hive_location: hiveLocationResponseSchema,
  queen_location: queenLocationResponseSchema,
  hive_source: hiveOptionResponseSchema,
  hive_type: hiveOptionResponseSchema,
  creator: identifierResponseSchema,
  editor: identifierResponseSchema,
});

export const hivePaginatedResponseSchema = z.object({
  results: z.array(hiveResponseSchema),
  total: z.number(),
});
export const hivesResponseSchema = z.array(hiveResponseSchema);
export const hiveIdsResponseSchema = z.array(z.number());
export const hiveMutationCountResponseSchema = z.number();
export const hiveMutationCountsResponseSchema = z.array(z.number());

export const hiveDetailResponseSchema = hiveResponseSchema.extend({
  sameLocation: z.array(
    z.looseObject({
      id: z.number(),
      name: z.string(),
      position: nullableNumber,
    }),
  ),
  firstMovedate: movedateResponseSchema,
});

export const hiveListQuerySchema = compatibilityQuerySchema;

export const hiveIdParamsSchema = z.object({ id: numberSchema });

export const hiveTaskQuerySchema = z.object({
  apiary: z.boolean().optional(),
  year: numberSchema.optional(),
});

export const hiveSchema = z.object({
  name: z.string().min(1).max(36).trim(),
  grouphive: z.number().int().optional().default(0),
  position: z.number().int().optional().default(0),
  note: z.string().max(2000).optional(),
  modus: z.boolean().optional(),
  modus_date: z.string().optional(),
  deleted: z.boolean().optional(),
  source_id: numberSchema.optional(),
  type_id: numberSchema.optional(),
});

export const hivePatchBodySchema = z.object({
  ids: z.array(numberSchema),
  data: hiveSchema.partial(),
});

export const hiveCreateBodySchema = z
  .object({
    apiary_id: numberSchema,
    start: z.number().min(0).max(10000),
    repeat: z.number().min(0).max(100),
    date: z.string(),
  })
  .merge(hiveSchema);

export const hiveIdsBodySchema = z.object({ ids: z.array(numberSchema) });

export const hiveStatusBodySchema = z.object({
  ids: z.array(numberSchema),
  status: z.boolean(),
});

export const hivePositionBodySchema = z.object({
  data: z.array(z.object({ id: numberSchema, position: z.number() })),
});

export type HiveListQuery = z.infer<typeof hiveListQuerySchema>;
export type HiveIdParams = z.infer<typeof hiveIdParamsSchema>;
export type HiveTaskQuery = z.infer<typeof hiveTaskQuerySchema>;
export type HivePatchBody = z.infer<typeof hivePatchBodySchema>;
export type HiveCreateBody = z.infer<typeof hiveCreateBodySchema>;
export type HiveIdsBody = z.infer<typeof hiveIdsBodySchema>;
export type HiveStatusBody = z.infer<typeof hiveStatusBodySchema>;
export type HivePositionBody = z.infer<typeof hivePositionBodySchema>;
