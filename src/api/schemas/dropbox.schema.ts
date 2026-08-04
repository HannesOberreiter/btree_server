import { z } from 'zod';

export const deleteParamsSchema = z.object({
  id: z.string().min(1).optional(),
});
export type DeleteParams = z.infer<typeof deleteParamsSchema>;

export const authParamsSchema = z.object({ code: z.string().min(1) });
export type AuthParams = z.infer<typeof authParamsSchema>;

export const dropboxTokenResultSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
});

export const dropboxAuthorizationResponseSchema = z.object({ url: z.string() });
export const dropboxTokenResponseSchema = z.object({
  token: z.string().optional(),
});
export const dropboxDeleteResponseSchema = z.number();
