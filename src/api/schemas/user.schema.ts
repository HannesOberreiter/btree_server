import { z } from 'zod';

export const patchBodySchema = z.object({
  password: z.string().optional(),
  newPassword: z.string().optional(),
  email: z.string().optional(),
  username: z.string().optional(),
  lang: z.string().optional(),
  format: z.string().optional(),
  saved_company: z.number().optional(),
  sound: z.boolean().optional(),
  todo: z.boolean().optional(),
  acdate: z.boolean().optional(),
  newsletter: z.boolean().optional(),
});
export type PatchBody = z.infer<typeof patchBodySchema>;

export const deleteBodySchema = z.object({
  password: z.string().trim(),
});
export type DeleteBody = z.infer<typeof deleteBodySchema>;

export const checkPasswordBodySchema = z.object({
  password: z.string().trim(),
});
export type CheckPasswordBody = z.infer<typeof checkPasswordBodySchema>;

export const changeCompanyBodySchema = z
  .object({
    saved_company: z.number(),
  })
  .loose();
export type ChangeCompanyBody = z.infer<typeof changeCompanyBodySchema>;

export const deleteFederatedCredentialsParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type DeleteFederatedCredentialsParams = z.infer<
  typeof deleteFederatedCredentialsParamsSchema
>;

export const addFederatedCredentialsBodySchema = z.object({
  email: z.email(),
  provider: z.enum(['google', 'apple']).default('google'),
});
export type AddFederatedCredentialsBody = z.infer<
  typeof addFederatedCredentialsBodySchema
>;

export const deleteRedisSessionParamsSchema = z.object({
  id: z.string(),
});
export type DeleteRedisSessionParams = z.infer<
  typeof deleteRedisSessionParamsSchema
>;
