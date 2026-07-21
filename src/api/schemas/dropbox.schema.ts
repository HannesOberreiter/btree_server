import { z } from 'zod';

export const deleteParamsSchema = z.object({
  id: z.string().min(1).optional(),
});
export type DeleteParams = z.infer<typeof deleteParamsSchema>;

export const authParamsSchema = z.object({ code: z.string().min(1) });
export type AuthParams = z.infer<typeof authParamsSchema>;
