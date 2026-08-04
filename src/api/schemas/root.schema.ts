import { z } from 'zod';

export const reportBodySchema = z.looseObject({
  violation: z.unknown().optional(),
});
export type ReportBody = z.infer<typeof reportBodySchema>;
