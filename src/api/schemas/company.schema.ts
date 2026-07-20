import { z } from 'zod';

import { jsonDateSchema } from './common.schema.js';

export const companyResponseSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  paid: jsonDateSchema.nullable().optional(),
  api_active: z.boolean().optional(),
  api_key: z.string().nullable().optional(),
  created_at: jsonDateSchema.nullable().optional(),
  updated_at: jsonDateSchema.nullable().optional(),
});

export const companyPatchResponseSchema = companyResponseSchema.extend({
  api_active: z.boolean(),
});

export const companyApiKeyResponseSchema = z.object({
  api_key: z.string().nullable(),
});

export const companyCountResponseSchema = z.looseObject({
  user_id: z.number(),
  count: z.union([z.number(), z.string()]),
  kind: z.string(),
});

export const companyPatchSchema = z.looseObject({
  name: z.string().min(3).max(128).trim().optional(),
  password: z.string().optional(),
  api_change: z.boolean().optional(),
});

export const companyCreateSchema = z.object({
  name: z.string().min(3).max(128).trim(),
});

export const companyCouponSchema = z.object({
  coupon: z.string().min(3).max(128).trim(),
});

export const companyInvoiceSchema = z.object({
  amount: z.number().int().min(55).max(10000),
  quantity: z.number().int().min(1).max(10),
});

export const companyPaidResponseSchema = z.object({
  paid: jsonDateSchema,
});

export const companyDeleteParamsSchema = z.object({
  id: z.string(),
});

export const companyChangeResponseSchema = z.looseObject({
  result: z.number(),
  data: z.looseObject({}),
});

export const companyImportSchema = z.looseObject({
  upload: z.unknown(),
});

export const companyImportResponseSchema = z.object({
  name: z.string(),
});

export const companyPaymentsResponseSchema = z.object({
  company: z.object({
    count: z.number(),
    months: z.number(),
  }),
  countCurrentYear: z.union([z.number(), z.string()]),
  countLastYear: z.union([z.number(), z.string()]),
});

export type CompanyPatchBody = z.infer<typeof companyPatchSchema>;
export type CompanyCreateBody = z.infer<typeof companyCreateSchema>;
export type CompanyCouponBody = z.infer<typeof companyCouponSchema>;
export type CompanyInvoiceBody = z.infer<typeof companyInvoiceSchema>;
export type CompanyDeleteParams = z.infer<typeof companyDeleteParamsSchema>;
export type CompanyImportBody = z.infer<typeof companyImportSchema>;
