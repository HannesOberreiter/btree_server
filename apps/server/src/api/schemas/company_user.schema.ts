import { z } from 'zod';

import { jsonDateSchema } from './common.schema.js';
import { companyChangeResponseSchema } from './company.schema.js';

export const companyUserResponseSchema = z.looseObject({
  id: z.number(),
  user_id: z.number(),
  bee_id: z.number(),
  rank: z.number(),
  user: z.looseObject({
    id: z.number(),
    email: z.string(),
    username: z.string().nullable().optional(),
    last_visit: jsonDateSchema,
  }),
  company: z.looseObject({
    id: z.number(),
    name: z.string(),
  }),
});

export const companyUserAddSchema = z.object({
  email: z.email(),
});

export const companyUserAddResponseSchema = z.union([
  z.looseObject({
    userExists: z.object({ id: z.number() }),
  }),
  z.looseObject({
    email: z.string(),
    id: z.number().optional(),
    token: z.string().optional(),
  }),
]);

export const companyUserIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const companyUserCompanyParamsSchema = z.object({
  company_id: z.coerce.number().int().positive(),
});

export const companyUserRankSchema = z.object({
  rank: z.number(),
});

export { companyChangeResponseSchema };

export type CompanyUserAddBody = z.infer<typeof companyUserAddSchema>;
export type CompanyUserIdParams = z.infer<typeof companyUserIdParamsSchema>;
export type CompanyUserCompanyParams = z.infer<
  typeof companyUserCompanyParamsSchema
>;
export type CompanyUserRankBody = z.infer<typeof companyUserRankSchema>;
