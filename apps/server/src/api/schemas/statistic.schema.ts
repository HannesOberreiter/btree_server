import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';

export const statisticTaskSchema = z.enum(['feed', 'harvest', 'treatment']);
export const statisticTaskParamsSchema = z.object({
  task: statisticTaskSchema,
});

export const statisticOrderFieldSchema = z.enum([
  'hive_id',
  'year',
  'hive.name',
  'amount_sum',
  'amount_avg',
  'frames_sum',
  'frames_avg',
  'water_avg',
  'brood',
  'pollen',
  'comb',
  'temper',
  'calm_comb',
  'swarm',
  'varroa',
  'strong',
]);

export const statisticListQuerySchema = z.object({
  order: z
    .union([statisticOrderFieldSchema, z.array(statisticOrderFieldSchema)])
    .optional(),
  direction: z
    .union([z.enum(['asc', 'desc']), z.array(z.enum(['asc', 'desc']))])
    .optional(),
  offset: numberSchema.optional(),
  limit: numberSchema.optional(),
  q: z.union([z.string(), z.number()]).optional(),
  filters: z.string().optional(),
  groupByType: z.boolean().optional(),
});

export const statisticSummaryQuerySchema = z.object({
  filters: z.string().optional(),
});

export const hiveCountApiaryQuerySchema = z.object({
  date: z.string(),
});

export const varroaStatisticQuerySchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  hive_ids: z
    .union([numberSchema, z.array(numberSchema)])
    .transform((value) => (Array.isArray(value) ? value : [value])),
});

const numericResultSchema = z.union([z.string(), z.number()]).nullable();
const hiveResponseSchema = z.looseObject({
  id: z.number(),
  name: z.string().nullable(),
});
const taskApiaryResponseSchema = z
  .looseObject({
    apiary_id: z.number().nullable(),
    apiary_name: z.string().nullable(),
    user_id: z.number().nullable(),
  })
  .nullable();
const typeResponseSchema = z
  .looseObject({
    id: z.number(),
    name: z.string().nullable(),
  })
  .nullable();

export const taskStatisticResponseSchema = z.object({
  year: z.number().nullable().optional(),
  hive_id: z.number().nullable().optional(),
  hive_count: numericResultSchema.optional(),
  amount_sum: numericResultSchema.optional(),
  amount_avg: numericResultSchema.optional(),
  frames_sum: numericResultSchema.optional(),
  frames_avg: numericResultSchema.optional(),
  water_avg: numericResultSchema.optional(),
  brood: numericResultSchema.optional(),
  pollen: numericResultSchema.optional(),
  comb: numericResultSchema.optional(),
  temper: numericResultSchema.optional(),
  calm_comb: numericResultSchema.optional(),
  swarm: numericResultSchema.optional(),
  varroa: numericResultSchema.optional(),
  strong: numericResultSchema.optional(),
  hive: hiveResponseSchema.optional(),
  task_apiary: taskApiaryResponseSchema.optional(),
  type: typeResponseSchema.optional(),
});
export const taskStatisticListResponseSchema = z.array(
  taskStatisticResponseSchema,
);
export const taskStatisticPageResponseSchema = z.object({
  results: taskStatisticListResponseSchema,
  total: z.number(),
});

export const hiveCountTotalResponseSchema = z.array(
  z.object({
    year: z.number(),
    quarter: z.number(),
    ident: z.string(),
    increase: numericResultSchema.optional(),
    decrease: numericResultSchema.optional(),
    change: z.number(),
    total: z.number(),
    user_id: z.number().nullable().optional(),
  }),
);

export const hiveCountApiaryResponseSchema = z.array(
  z.object({
    apiary_id: z.number().nullable(),
    total: numericResultSchema,
    user_id: z.number().nullable(),
    name: z.string().nullable(),
  }),
);

const varroaDatasetValueSchema = z.union([z.string(), z.number(), z.null()]);
export const varroaStatisticResponseSchema = z.object({
  datasetCheckup: z.record(
    z.string(),
    z.array(z.array(varroaDatasetValueSchema)),
  ),
  datasetTreatment: z.record(
    z.string(),
    z.array(z.array(varroaDatasetValueSchema)),
  ),
  stats: z.array(
    z.object({
      hive_name: z.string(),
      varroa: z.object({
        min: z.number(),
        max: z.number(),
        avg: z.number(),
      }),
    }),
  ),
});

export type StatisticTask = z.infer<typeof statisticTaskSchema>;
export type StatisticOrderField = z.infer<typeof statisticOrderFieldSchema>;
export type StatisticListQuery = z.infer<typeof statisticListQuerySchema>;
export type StatisticSummaryQuery = z.infer<typeof statisticSummaryQuerySchema>;
export type VarroaStatisticQuery = z.infer<typeof varroaStatisticQuerySchema>;
