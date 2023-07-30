import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import RootController from '@/api/controllers/root.controller';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get('/status', {}, RootController.status);

  server.post('/report-violation', {}, RootController.report);

  done();
}
