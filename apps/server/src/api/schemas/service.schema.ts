import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';

export const getWeatherDataParamsSchema = z.object({ apiary_id: numberSchema });
export type GetWeatherDataParams = z.infer<typeof getWeatherDataParamsSchema>;

/** Local time of the apiary as `YYYY-MM-DDTHH:mm`, without offset. */
const localTimeSchema = z.string();

export const apiaryForecastResponseSchema = z.object({
  timezone: z.string(),
  thresholds: z.object({
    flight_min_temperature: z.number(),
    flight_max_precipitation_probability: z.number(),
    flight_max_wind_speed: z.number(),
    frost_temperature: z.number(),
    heat_temperature: z.number(),
  }),
  current: z.object({
    time: localTimeSchema,
    temperature: z.number(),
    feels_like: z.number(),
    humidity: z.number(),
    wind_speed: z.number(),
    wind_gust: z.number().nullable(),
    precipitation: z.number(),
    condition: z.number(),
    is_day: z.boolean(),
    flight: z.boolean(),
  }),
  hourly: z.array(
    z.object({
      time: localTimeSchema,
      temperature: z.number(),
      precipitation: z.number(),
      precipitation_probability: z.number(),
      wind_speed: z.number(),
      condition: z.number(),
      is_day: z.boolean(),
      flight: z.boolean(),
    }),
  ),
  daily: z.array(
    z.object({
      date: z.string(),
      temperature_min: z.number(),
      temperature_max: z.number(),
      precipitation: z.number(),
      precipitation_probability: z.number(),
      wind_speed: z.number(),
      condition: z.number(),
      sunrise: localTimeSchema,
      sunset: localTimeSchema,
      flight_day: z.boolean(),
      flight_hours: z.number().nullable(),
      frost: z.boolean(),
      heat: z.boolean(),
    }),
  ),
  alerts: z.array(
    z.object({
      sender: z.string(),
      event: z.string(),
      start: localTimeSchema,
      end: localTimeSchema,
      description: z.string(),
    }),
  ),
});
export type ApiaryForecast = z.infer<typeof apiaryForecastResponseSchema>;

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
