import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';

export const publicTaxaSchema = z.enum(['velutina', 'aethina_tumida']);
export const publicTaxaParamsSchema = z.object({ taxa: publicTaxaSchema });
export const publicTaxaYearParamsSchema = publicTaxaParamsSchema.extend({
  year: numberSchema,
});

export type PublicTaxaParams = z.infer<typeof publicTaxaParamsSchema>;
export type PublicTaxaYearParams = z.infer<typeof publicTaxaYearParamsSchema>;
