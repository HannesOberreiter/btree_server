import RedisStore from 'connect-redis';
import { randomUUID } from 'node:crypto';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { ZodError } from 'zod';

import { RedisServer } from '@/servers/redis.server.js';
import { authorized, env, sessionSecret } from '@config/environment.config.js';
import { Logger } from '@/api/services/logger.service.js';
import { ENVIRONMENT } from './constants.config.js';
import routes from '@/api/routes/index.js';
import fastifyRateLimit from '@fastify/rate-limit';
import { checkMySQLError } from '@/api/utils/error.util.js';

import fastify, { FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyCompress from '@fastify/compress';
import fastifyHelmet from '@fastify/helmet';

/**
 * @description Instantiate server application.
 */
export class Application {
  public app: FastifyInstance;
  private redisStore: RedisStore;
  private logger: Logger;

  constructor() {
    this.init();
    this.createSessionStore();
    this.plug();
  }

  private init(): void {
    this.logger = Logger.getInstance();
    this.app = fastify({
      logger: this.logger.pino,
      disableRequestLogging: false,
      trustProxy: true,
      bodyLimit: 1048576 * 50, // 50 MB
      maxParamLength: 10000,
      ajv: {
        customOptions: {
          removeAdditional: false, // Refer to [ajv options](https://ajv.js.org/options.html#removeadditional)
        },
      },
    });
  }

  private createSessionStore(): void {
    const redis = RedisServer.client;
    this.redisStore = new RedisStore({
      client: redis,
      prefix: 'btree_sess:',
    });
  }

  private plug(): void {
    /**
     * @description GZIP compression
     * @see https://www.npmjs.com/package/@fastify/compress
     */
    this.app.register(fastifyCompress);

    /**
     * @description Important security headers for Fastify. It is a tiny wrapper around helmet.
     * @see https://github.com/fastify/fastify-helmet
     */
    this.app.register(fastifyHelmet, {
      hidePoweredBy: true,
      noSniff: true,
      referrerPolicy: { policy: 'no-referrer' },
    });

    /**
     * @description Enable CORS - Cross Origin Resource Sharing
     */
    this.app.addHook('preHandler', (req, reply, done) => {
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
      reply.header('Access-Control-Allow-Methods', '*');

      if (req.method.toLowerCase() === 'options') {
        reply.send();
      }

      done();
    });

    this.app.register(fastifyCookie);

    this.app.register(fastifySession, {
      idGenerator: function (req) {
        let id = randomUUID();
        if ('bee_id' in req) {
          id = `${req.bee_id}:${id}`;
        }
        return id;
      },
      cookieName:
        env === ENVIRONMENT.staging
          ? '_auth-btree-session-staging'
          : '_auth-btree-session',
      cookiePrefix: 's:',
      secret: sessionSecret,
      saveUninitialized: false,
      rolling: false,
      store: this.redisStore,
      cookie: {
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        secure: env === ENVIRONMENT.production,
        domain: env === ENVIRONMENT.production ? 'btree.at' : '',
        path: '/',
      },
    });

    /**
     * @description Passport configuration
     * @see http://www.passportjs.org/
     */

    //this.app.register(fastifyPassport.initialize());
    //this.app.register(fastifyPassport.secureSession());

    //fastifyPassport.use('google', PassportConfiguration.factory('google'));

    /*
    fastifyPassport.registerUserSerializer(async (user, req) => {
      this.logger.log('info', 'Serializing user', { user });
      req.session.user = user as any;
    });
    fastifyPassport.registerUserDeserializer(async (user, req) => {
      this.logger.log('info', 'Deserzialize user', { user });
      req.session.user = user as any;
    });
*/
    /**
     * @description Configure API Rate limit
     * @see https://github.com/fastify/fastify-rate-limit
     */
    this.app.register(fastifyRateLimit, {
      timeWindow: 1000 * 60, // 1 minute
      max: 1000,
    });

    /**
     * @description Global validator and serializer compiler using Zod
     */
    this.app.setValidatorCompiler(validatorCompiler);
    this.app.setSerializerCompiler(serializerCompiler);

    /**
     * @description Global logger
     */
    this.app.setErrorHandler(function (error, request, reply) {
      if (error instanceof ZodError) {
        request.log.error(
          {
            user: request?.session?.user,
            req: request,
            error: error.issues,
            path: request.url,
          },
          'Zod validation error',
        );
        reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          issues: error.issues,
        });
        return;
      }
      let e = checkMySQLError(error);
      this.log.error(
        {
          user: request?.session?.user,
          req: request,
          error: e.cause ? e.cause : e,
          path: request.url,
        },
        e.message ? e.message : 'Unhandled error',
      );
      if (e.statusCode) {
        reply.status(e.statusCode).send({
          statusCode: e.statusCode,
          error: e.message,
        });
        return;
      }
      throw e;
    });

    this.app.register(routes, {
      prefix: '/api/',
    });

    this.app.ready();
  }
}
