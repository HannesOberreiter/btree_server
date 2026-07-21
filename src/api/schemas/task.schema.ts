import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';
import { compatibilityQuerySchema } from './common.schema.js';

export const taskListQuerySchema = compatibilityQuerySchema;

export const taskDataSchema = z
  .object({
    date: z.string().optional(),
    enddate: z.string().optional(),
    amount: z.number().nullable().optional(),
    frames: z.number().nullable().optional(),
    water: z.number().nullable().optional(),
    charge: z.string().nullable().optional(),
    wait: z.number().nullable().optional(),
    temperature: z.number().nullable().optional(),
    note: z.string().max(2000).nullable().optional(),
    url: z.string().max(512).nullable().optional(),
    done: z.boolean().optional(),
    deleted: z.boolean().optional(),
    type_id: numberSchema.nullable().optional(),
    vet_id: numberSchema.nullable().optional(),
    disease_id: numberSchema.nullable().optional(),
  })
  .loose();

export const taskCreateBodySchema = taskDataSchema.extend({
  hive_ids: z.array(numberSchema),
  interval: z.number().min(0).max(365).optional(),
  repeat: z.number().min(0).max(15).optional(),
});

export const taskPatchBodySchema = z.object({
  ids: z.array(numberSchema),
  data: taskDataSchema.partial(),
});

export const taskStatusBodySchema = z.object({
  ids: z.array(numberSchema),
  status: z.boolean(),
});

export const taskDateBodySchema = z.object({
  ids: z.array(numberSchema),
  start: z.string(),
  end: z.string(),
});

export const taskIdsBodySchema = z.object({ ids: z.array(numberSchema) });

export type TaskListQuery = z.infer<typeof taskListQuerySchema>;
export type TaskCreateBody = z.infer<typeof taskCreateBodySchema>;
export type TaskPatchBody = z.infer<typeof taskPatchBodySchema>;
export type TaskStatusBody = z.infer<typeof taskStatusBodySchema>;
export type TaskDateBody = z.infer<typeof taskDateBodySchema>;
export type TaskIdsBody = z.infer<typeof taskIdsBodySchema>;
