import { z } from 'zod';

import { jsonDateSchema } from './common.schema.js';

export const appleCallbackSchema = z.object({
  code: z.string(),
  id_token: z.string(),
  state: z.string(),
  user: z
    .union([
      z.string().transform((str, ctx) => {
        try {
          const parsed = JSON.parse(str);
          return z
            .object({
              email: z.email(),
            })
            .parse(parsed);
        } catch {
          ctx.addIssue({
            code: 'custom',
            message: 'Invalid JSON in user field',
          });
          return z.NEVER;
        }
      }),
      z.object({
        email: z.email(),
      }),
      z.literal(''),
      z.null(),
    ])
    .optional(),
  error: z.string().optional(),
});

export const appleCallbackGetSchema = z.object({
  code: z.string(),
  id_token: z.string().optional(),
  state: z.string(),
  user: z.string().optional(),
  error: z.string().optional(),
});

export const registerBodySchema = z.object({
  email: z.email(),
  password: z.string().min(6).max(128).trim(),
  name: z.string().min(3).max(128).trim(),
  lang: z.string().min(2).max(2),
  newsletter: z.boolean(),
  source: z.string(),
  isOAuth: z.boolean().optional(),
});
export type RegisterBody = z.infer<typeof registerBodySchema>;

export const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(6).max(128).trim(),
});

export const confirmBodySchema = z.object({
  confirm: z.string().min(100).max(128),
});

export const emailBodySchema = z.object({
  email: z.email(),
});

export const resetPasswordBodySchema = z.object({
  key: z.string().min(100).max(128),
  password: z.string().min(6).max(128).trim(),
});

export const discourseQuerySchema = z.object({
  payload: z.string(),
  sig: z.string(),
});

export const googleCallbackQuerySchema = z.object({
  code: z.string(),
});

const companyResponseSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  paid: jsonDateSchema.nullable().optional(),
  rank: z.number().nullable().optional(),
  api_active: z.boolean().optional(),
});

const authenticatedUserResponseSchema = z.looseObject({
  id: z.number(),
  email: z.string(),
  saved_company: z.number().nullable().optional(),
  username: z.string().nullable().optional(),
  state: z.number(),
  lang: z.string(),
  format: z.string().nullable().optional(),
  sound: z.boolean().optional(),
  todo: z.boolean().optional(),
  acdate: z.boolean().optional(),
  newsletter: z.boolean().optional(),
  company: z.array(companyResponseSchema),
});

export const registerResponseSchema = z.object({
  email: z.string(),
  activate: z.string(),
});

export const loginResponseSchema = z.object({
  data: authenticatedUserResponseSchema,
});

export const logoutResponseSchema = z.boolean();

export const emailResponseSchema = z.object({
  email: z.string(),
});

export const resetRequestResponseSchema = z.object({
  email: z.string(),
  token: z.string().optional(),
  id: z.number().optional(),
});

export const discourseResponseSchema = z.object({
  q: z.string(),
});

export const oauthUrlResponseSchema = z.object({
  url: z.string(),
});

export const statusResponseSchema = z.object({
  status: z.string(),
});

export type AppleCallback = z.infer<typeof appleCallbackSchema>;
export type AppleCallbackQuery = z.infer<typeof appleCallbackGetSchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type ConfirmBody = z.infer<typeof confirmBodySchema>;
export type EmailBody = z.infer<typeof emailBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
export type DiscourseQuery = z.infer<typeof discourseQuerySchema>;
export type GoogleCallbackQuery = z.infer<typeof googleCallbackQuerySchema>;
