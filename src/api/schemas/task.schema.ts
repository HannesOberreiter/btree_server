import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';
import {
  actorResponseSchema,
  compatibilityQuerySchema,
  jsonDateSchema,
} from './common.schema.js';

const nullableNumber = z.number().nullable().optional();
const nullableString = z.string().nullable().optional();
const nullableDate = jsonDateSchema.nullable().optional();

const taskOptionResponseSchema = z.looseObject({
  id: z.number(),
  name: nullableString,
  favorite: z.boolean().nullable().optional(),
  modus: z.boolean().nullable().optional(),
  user_id: nullableNumber,
  created_at: nullableDate,
  updated_at: nullableDate,
});

const taskHiveResponseSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  position: nullableNumber,
  grouphive: nullableNumber,
  modus: z.boolean().nullable().optional(),
  deleted: z.boolean().nullable().optional(),
});

const taskApiaryResponseSchema = z.looseObject({
  apiary_id: z.number(),
  apiary_name: z.string(),
  user_id: nullableNumber,
});

export const taskResponseSchema = z.looseObject({
  id: z.number(),
  date: nullableDate,
  enddate: nullableDate,
  amount: nullableNumber,
  frames: nullableNumber,
  water: nullableNumber,
  charge: nullableString,
  wait: nullableNumber,
  temperature: nullableNumber,
  note: nullableString,
  url: nullableString,
  done: z.boolean().nullable().optional(),
  deleted: z.boolean().nullable().optional(),
  deleted_at: nullableDate,
  user_id: nullableNumber,
  hive_id: nullableNumber,
  type_id: nullableNumber,
  disease_id: nullableNumber,
  vet_id: nullableNumber,
  bee_id: nullableNumber,
  edit_id: nullableNumber,
  ai_created_at: nullableDate,
  ai_updated_at: nullableDate,
  ai_deleted_at: nullableDate,
  created_at: nullableDate,
  updated_at: nullableDate,
  hive: taskHiveResponseSchema.nullable().optional(),
  type: taskOptionResponseSchema.nullable().optional(),
  disease: taskOptionResponseSchema.nullable().optional(),
  vet: taskOptionResponseSchema.nullable().optional(),
  feed_apiary: taskApiaryResponseSchema.nullable().optional(),
  harvest_apiary: taskApiaryResponseSchema.nullable().optional(),
  treatment_apiary: taskApiaryResponseSchema.nullable().optional(),
  creator: actorResponseSchema.optional(),
  editor: actorResponseSchema.optional(),
});

export const taskPaginatedResponseSchema = z.object({
  results: z.array(taskResponseSchema),
  total: z.number(),
});
export const taskRowsResponseSchema = z.array(taskResponseSchema);
export const taskIdsResponseSchema = z.array(z.number());
export const taskMutationCountResponseSchema = z.number();

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
