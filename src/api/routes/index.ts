import { FastifyInstance } from 'fastify';
import v1Auth from './v1/auth.route';
import v1Apiary from './v1/apiary.route';
import v1Charge from './v1/charge.route';

export default function routes(app: FastifyInstance, _options: any, done: any) {
  app.register(v1Auth, {
    prefix: '/v1/auth/',
  });
  app.register(v1Apiary, {
    prefix: '/api/v1/apiary/',
  });
  app.register(v1Apiary, {
    prefix: '/api/v1/calendar/',
  });
  app.register(v1Charge, {
    prefix: '/api/v1/charge/',
  });

  done();
}
