import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import ServiceController from '../../controllers/service.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  permissiveJsonResponseSchema,
  compatibilityQuerySchema,
} from '../../schemas/common.schema.js';
import {
  getWeatherDataParamsSchema,
  getGruenlandtemperatursummeParamsSchema,
  paypalCreateOrderBodySchema,
  paypalCapturePaymentParamsSchema,
  stripeCreateOrderBodySchema,
  mollieCreateOrderBodySchema,
} from '../../schemas/service.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/elevation',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        querystring: z.object({
          latitude: z.coerce.number().min(-90).max(90),
          longitude: z.coerce.number().min(-180).max(180),
        }),
      },
    },
    ServiceController.getElevation,
  );

  server.get(
    '/temperature/:apiary_id',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        params: getWeatherDataParamsSchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
    },
    ServiceController.getWeatherData,
  );

  server.get(
    '/gruenlandtemperatursumme/:apiary_id',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        params: getGruenlandtemperatursummeParamsSchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
    },
    ServiceController.getGruenlandtemperatursumme,
  );

  server.post(
    '/paypal/orders',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: paypalCreateOrderBodySchema,
      },
    },
    ServiceController.paypalCreateOrder,
  );

  server.post(
    '/paypal/orders/:orderID/capture',
    {
      schema: {
        params: paypalCapturePaymentParamsSchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
    },
    ServiceController.paypalCapturePayment,
  );

  server.post(
    '/stripe/orders',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: stripeCreateOrderBodySchema,
      },
    },
    ServiceController.stripeCreateOrder,
  );

  server.post(
    '/mollie/orders',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: mollieCreateOrderBodySchema,
      },
    },
    ServiceController.mollieCreateOrder,
  );

  server.get(
    '/map/american_foulbrood',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
    },
    ServiceController.getAFBMapData,
  );

  done();
}
