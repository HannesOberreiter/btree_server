import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@/config/constants.config';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import RearingStepController from '@/api/controllers/rearing_step.controller';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin]),
    },
    RearingStepController.post,
  );

  server.delete(
    '/:id',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        params: z.object({
          id: z.string(),
        }),
      },
    },
    RearingStepController.delete,
  );

  server.patch(
    '/updatePosition',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: z.object({
          data: z.array(
            z.object({
              id: z.number(),
              position: z.number(),
              sleep_before: z.number(),
            }),
          ),
        }),
      },
    },
    RearingStepController.updatePosition,
  );

  done();
}
