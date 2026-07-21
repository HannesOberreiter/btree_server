import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';
import { compatibilityQuerySchema } from './common.schema.js';

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
