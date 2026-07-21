import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';

export const optionTableSchema = z.enum([
  'charge_types',
  'hive_sources',
  'hive_types',
  'feed_types',
  'harvest_types',
  'checkup_types',
  'queen_matings',
  'queen_races',
  'treatment_diseases',
  'treatment_types',
  'treatment_vets',
]);
export const optionTableParamsSchema = z.object({ table: optionTableSchema });
export type OptionTableParams = z.infer<typeof optionTableParamsSchema>;

export const patchBodySchema = z.object({
  ids: z.array(numberSchema),
  data: z.object({}).loose(),
});
export type PatchBody = z.infer<typeof patchBodySchema>;

export const postBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    modus: z.boolean().optional(),
    favorite: z.boolean().optional(),
  })
  .loose();
export type PostBody = z.infer<typeof postBodySchema>;

export const updateStatusBodySchema = z.object({
  ids: z.array(numberSchema),
  status: z.boolean(),
});
export type UpdateStatusBody = z.infer<typeof updateStatusBodySchema>;

export const updateFavoriteBodySchema = z.object({
  ids: z.array(numberSchema),
});
export type UpdateFavoriteBody = z.infer<typeof updateFavoriteBodySchema>;

export const batchDeleteBodySchema = z.object({
  ids: z.array(numberSchema),
});
export type BatchDeleteBody = z.infer<typeof batchDeleteBodySchema>;

export const batchGetBodySchema = z.object({
  ids: z.array(numberSchema),
});
export type BatchGetBody = z.infer<typeof batchGetBodySchema>;
