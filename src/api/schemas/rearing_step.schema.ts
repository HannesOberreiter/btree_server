import { z } from 'zod';

export const postBodySchema = z
  .object({
    type_id: z.number().optional(),
    detail_id: z.number().optional(),
    position: z.number(),
    sleep_after: z.number().min(0).max(9000).optional(),
    sleep_before: z.number().min(0).max(9000).optional(),
  })
  .loose();
export type PostBody = z.infer<typeof postBodySchema>;

export const deleteParamsSchema = z.object({
  id: z.string(),
});
export type DeleteParams = z.infer<typeof deleteParamsSchema>;

export const updatePositionBodySchema = z.object({
  data: z.array(
    z.object({
      id: z.number(),
      position: z.number(),
      sleep_before: z.number(),
    }),
  ),
});
export type UpdatePositionBody = z.infer<typeof updatePositionBodySchema>;
