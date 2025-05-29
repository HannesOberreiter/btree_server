import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import fastifyCompress from '@fastify/compress';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';

import fastifyMultipart from '@fastify/multipart';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySession from '@fastify/session';
import { RedisStore } from 'connect-redis';
import fastify from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import queryString from 'query-string';

import { ZodError } from 'zod';
import routes from '../api/routes/index.js';
import { checkMySQLError } from '../api/utils/error.util.js';
import {
  authorized,
  env,
  sessionSecret,
} from '../config/environment.config.js';
import { RedisServer } from '../servers/redis.server.js';
import { Logger } from '../services/logger.service.js';
import { ENVIRONMENT } from './constants.config.js';

/**
 * @description Instantiate server application.
 */
export class Application {
  public app: FastifyInstance;
  private sessionStore: RedisStore;
  private logger: Logger;

  constructor() {
    this.init();
    this.createSessionStore();
    this.plug();
  }

  private init(): void {
    this.logger = Logger.getInstance();
    this.app = fastify({
      loggerInstance: this.logger.pino,
      disableRequestLogging: false,
      trustProxy: true,
      bodyLimit: 1048576 * 50, // 50 MB
      maxParamLength: 10000,
      querystringParser: str =>
        queryString.parse(str, {
          arrayFormat: 'bracket',
          parseBooleans: true,
          parseNumbers: true,
        }),
      ajv: {
        customOptions: {
          removeAdditional: false, // Refer to [ajv options](https://ajv.js.org/options.html#removeadditional)
          // coerceTypes: 'array',
        },
      },
    });
  }

  private createSessionStore(): void {
    const redis = RedisServer.client;
    this.sessionStore = new RedisStore({
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
    this.app.addHook('onRequest', (req, reply, done) => {
      // Set undefined CORS header
      // https://github.com/expressjs/cors/issues/262
      if (!req.headers.origin) {
        if (req.headers.referer) {
          try {
            const url = new URL(req.headers.referer);
            req.headers.origin = url.origin;
          }
          catch (e) {
            Logger.getInstance().pino.error(e, 'Error parsing referer');
            req.headers.origin = req.headers?.host ?? '';
          }
        }
        else if (req.headers.host) {
          req.headers.origin = req.headers.host;
        }
      }

      const origin = req.headers.origin;

      const isExternal
        = req.url.includes('external')
          || req.url.includes('auth/google/callback');

      if (isExternal || env === ENVIRONMENT.development) {
        reply.header('Access-Control-Allow-Origin', '*');
      }
      else {
        reply.header('Access-Control-Allow-Origin', origin);
        reply.header('Access-Control-Allow-Credentials', 'true');
      }

      if (!isExternal) {
        if (!authorized.includes(origin)) {
          reply.status(406).send();
        }
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

    this.app.register(fastifyCookie);

    this.app.register(fastifySession, {
      idGenerator(req) {
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
      store: this.sessionStore,
      cookie: {
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        secure: env === ENVIRONMENT.production,
        domain: env === ENVIRONMENT.production ? 'btree.at' : '',
        path: '/',
      },
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
     * @description Global logger
     */
    this.app.setErrorHandler(function (error, request, reply) {
      if (hasZodFastifySchemaValidationErrors(error)) {
        request.log.error(
          {
            user: request?.session?.user,
            req: request,
            error: error.validation,
            path: request.url,
          },
          'Zod validation error',
        );
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Request doesn\'t match the schema',
          statusCode: 400,
          issues: error.validation,
          details: {
            issues: error.validation,
            method: request.method,
            url: request.url,
          },
        });
      }

      if (isResponseSerializationError(error)) {
        request.log.error(
          {
            user: request?.session?.user,
            req: request,
            error: error.cause,
            path: request.url,
            method: error.method,
          },
          'Zod serialization error',
        );
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Response doesn\'t match the schema',
          statusCode: 500,
          issues: error.cause.issues,
          details: {
            issues: error.cause.issues,
            method: error.method,
            url: error.url,
          },
        });
      }

      const e = checkMySQLError(error);
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
          error: e.cause ? e.cause.type : e.type ? e.type : 'Unhandled error',
          cause: e.cause ?? undefined,
          message: e.message ?? undefined,
        });
        return;
      }
      throw e;
    });

    /**
     * @description Register multipart plugin
     */
    this.app.register(fastifyMultipart, {
      limits: {
        fileSize: 1048576 * 10, // 10 MB
        files: 1, // Max number of file fields
      },
      attachFieldsToBody: 'keyValues',
    });

    this.app.register(routes, {
      prefix: '/api/',
    });

    this.app.ready();
  }
}
