import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import PublicController from '../../controllers/public.controller.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/velutina/observations/recent',
    {},
    PublicController.getVelutinaObservationsRecent,
  );
  server.get(
    '/velutina/observations/stats',
    {},
    PublicController.getVelutinaObservationsStats,
  );
  server.get(
    '/velutina/observations/array',
    {},
    PublicController.getVelutinaObservationsArray,
  );

  done();
}
