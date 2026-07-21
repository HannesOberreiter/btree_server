import { z } from 'zod';

export const externalCalendarParamsSchema = z.object({
  source: z.string().min(1),
  api: z.string().min(1),
});

export const externalScaleParamsSchema = z.object({
  ident: z.string().min(1),
  api: z.string().min(1),
});

export const mollieWebhookBodySchema = z.looseObject({
  id: z.string().min(1),
});

export const externalScaleQuerySchema = z.object({
  action: z.enum(['CREATE', 'CREATE_DEMO']),
  datetime: z.string().datetime().optional(),
  weight: z.number().optional(),
  temp1: z.number().optional(),
  temp2: z.number().optional(),
  hum: z.number().optional(),
  rain: z.number().optional(),
  note: z.string().max(300).optional(),
});

export type ExternalCalendarParams = z.infer<
  typeof externalCalendarParamsSchema
>;
export type ExternalScaleParams = z.infer<typeof externalScaleParamsSchema>;
export type MollieWebhookBody = z.infer<typeof mollieWebhookBodySchema>;
export type ExternalScaleQuery = z.infer<typeof externalScaleQuerySchema>;
