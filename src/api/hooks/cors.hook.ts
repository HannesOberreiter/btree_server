import { FastifyInstance } from 'fastify';

import { ENVIRONMENT } from '../../config/constants.config';
import { authorized, env } from '../../config/environment.config';

export default function cors(app: FastifyInstance, _options: any, done: any) {
  app.addHook('onRequest', (req, reply, done) => {
    // Set undefined CORS header
    // https://github.com/expressjs/cors/issues/262
    if (!req.headers.origin) {
      if (req.headers.referer) {
        const url = new URL(req.headers.referer);
        req.headers.origin = url.origin;
      } else if (req.headers.host) {
        req.headers.origin = req.headers.host;
      }
    }

    const origin = req.headers.origin;

    if (
      req.url.indexOf('external') >= 0 ||
      req.url.indexOf('auth/google/callback') >= 0 ||
      env === ENVIRONMENT.development ||
      env === ENVIRONMENT.ci
    ) {
      reply.header('Access-Control-Allow-Origin', '*');
    } else {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Access-Control-Allow-Credentials', 'true');
    }

    if (authorized.indexOf(origin) === -1) {
      reply.status(406).send();
    }

    reply.header(
      'Access-Control-Allow-Headers',
      'Origin, Content-Type, Accept, Authorization',
    );
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    reply.header(
      'Access-Control-Expose-Headers',
      'Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers',
    );

    if (req.method.toLowerCase() === 'options') {
      reply.send();
    }

    done();
  });
  done();
}
