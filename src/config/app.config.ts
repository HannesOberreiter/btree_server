import RedisStore from 'connect-redis';
import { randomUUID } from 'node:crypto';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { ZodError } from 'zod';
import httpErrors from 'http-errors';

import { RedisServer } from '@/servers/redis.server.js';
import { authorized, env, sessionSecret } from '@config/environment.config.js';
import { PassportConfiguration } from './passport.config.js';
import { Logger } from '@/api/services/logger.service.js';
import { ENVIRONMENT } from './constants.config.js';
import routes from '@/api/routes/index.js';

import fastifyPassport from '@fastify/passport';
import fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyCompress from '@fastify/compress';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';

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
      trustProxy: true,
      bodyLimit: 1048576 * 50, // 50 MB
      maxParamLength: 10000,
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
     * @see https://www.npmjs.com/package/cors
     */
    this.app.register(fastifyCors, (_instance) => {
      return (req: FastifyRequest, callback) => {
        if (!req.headers.origin) {
          // Set undefined CORS header
          // https://github.com/expressjs/cors/issues/262
          if (req.headers.referer) {
            const url = new URL(req.headers.referer);
            req.headers.origin = url.origin;
          } else if (req.headers.host) {
            req.headers.origin = req.headers.host;
          }
        }

        const origin = req.headers.origin;
        let corsOptions = {
          origin: true,
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
          allowedHeaders: [
            'Accept',
            'Content-Type',
            'Authorization',
            'Origin',
            'From',
          ],
        } as any;

        if (
          req.url.indexOf('external') >= 0 ||
          req.url.indexOf('auth/google/callback') >= 0
        ) {
          // Allow API calls to scale and iCal and google auth without CORS
          corsOptions = { origin: false, credentials: false };
        } else if (
          authorized.indexOf(origin) === -1 &&
          origin &&
          env !== ENVIRONMENT.development
        ) {
          callback(
            httpErrors.NotAcceptable(`Domain not allowed by CORS: ${origin}`),
            corsOptions,
          );
        }

        callback(null, corsOptions);
      };
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
    this.app.register(fastifyPassport.initialize());
    fastifyPassport.use('google', PassportConfiguration.factory('google'));

    fastifyPassport.registerUserSerializer(async (user, _done) => {
      return user;
    });
    fastifyPassport.registerUserDeserializer(async (user, _done) => {
      return user;
    });

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
     * @description Global error logger
     */
    this.app.setErrorHandler(function (error, request, reply) {
      if (error instanceof ZodError) {
        request.log.warn(error);
        reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          issues: error.issues,
        });
      }
      this.log.error(
        {
          user: request.user,
          label: 'Application',
          error: error,
          path: request.url,
        },
        'Error in request handler',
      );
      reply.send(error);
    });

    this.app.register(routes, {
      prefix: '/api/',
    });

    this.app.ready();
  }
}
