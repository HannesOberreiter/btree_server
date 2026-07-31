import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';

export const getWeatherDataParamsSchema = z.object({ apiary_id: numberSchema });
export type GetWeatherDataParams = z.infer<typeof getWeatherDataParamsSchema>;

export const getGruenlandtemperatursummeParamsSchema = z.object({
  apiary_id: numberSchema,
});
export type GetGruenlandtemperatursummeParams = z.infer<
  typeof getGruenlandtemperatursummeParamsSchema
>;

export const paypalCreateOrderBodySchema = z.object({
  amount: z.number().min(50),
  quantity: z.number().min(1).max(10),
});
export type PaypalCreateOrderBody = z.infer<typeof paypalCreateOrderBodySchema>;

export const paypalCapturePaymentParamsSchema = z.object({
  orderID: z.string().min(1),
});
export type PaypalCapturePaymentParams = z.infer<
  typeof paypalCapturePaymentParamsSchema
>;

export const mollieCreateOrderBodySchema = z.object({
  amount: z.number().min(50),
  quantity: z.number().min(1).max(10),
});
export type MollieCreateOrderBody = z.infer<typeof mollieCreateOrderBodySchema>;
