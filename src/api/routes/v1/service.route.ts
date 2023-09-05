import { Guard } from '../../hooks/guard.hook.js';
import { ROLES } from '../../../config/constants.config.js';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import ServiceController from '../../controllers/service.controller.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/temperature/:apiary_id',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
    },
    ServiceController.getTemperature,
  );

  server.post(
    '/paypal/orders',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: z.object({
          amount: z.number().min(50),
        }),
      },
    },
    ServiceController.paypalCreateOrder,
  );

  server.post(
    '/paypal/orders/:orderID/capture',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
    },
    ServiceController.paypalCapturePayment,
  );

  server.post(
    '/stripe/orders',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        body: z.object({
          amount: z.number().min(50),
        }),
      },
    },
    ServiceController.stripeCreateOrder,
  );

  server.post(
    '/wizbee/ask',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
      schema: {
        body: z.object({
          question: z.string().min(1).max(1000),
          lang: z.string().min(2).max(2),
        }),
      },
    },
    ServiceController.askWizBee,
  );

  done();
}
