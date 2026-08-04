import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';
import { jsonDateSchema } from './common.schema.js';

export const publicTaxaSchema = z.enum(['velutina', 'aethina_tumida']);
export const publicTaxaParamsSchema = z.object({ taxa: publicTaxaSchema });
export const publicTaxaYearParamsSchema = publicTaxaParamsSchema.extend({
  year: numberSchema,
});

export const publicObservationResponseSchema = z.object({
  location: z.object({ x: z.number(), y: z.number() }),
  uri: z.string(),
  observed_at: jsonDateSchema,
});
export const publicObservationListResponseSchema = z.array(
  publicObservationResponseSchema,
);
export const publicObservationStatsResponseSchema = z.object({
  count: z.number(),
});

export type PublicTaxaParams = z.infer<typeof publicTaxaParamsSchema>;
export type PublicTaxaYearParams = z.infer<typeof publicTaxaYearParamsSchema>;
