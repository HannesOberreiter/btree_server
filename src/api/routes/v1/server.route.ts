import { Guard } from '../../hooks/guard.hook.js';
import { ROLES } from '../../../config/constants.config.js';
import ServerController from '../../controllers/server.controller.js';

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/switch',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: z.object({
          key: z.string().min(1).max(80).trim(),
        }),
      },
    },
    ServerController.switch,
  );

  done();
}
