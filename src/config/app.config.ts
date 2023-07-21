/* eslint-disable @typescript-eslint/no-var-requires */
import { ENVIRONMENT } from '@/api/types/constants/environment.const';
import {
  authorized,
  env,
  contentType,
  sessionSecret,
} from '@config/environment.config';

import RedisStore from 'connect-redis';

// import Hpp from 'hpp';
// import BodyParser from 'body-parser';

import { notAcceptable } from '@hapi/boom';

import { Container } from '@config/container.config';

// import { HelmetConfiguration } from '@config/helmet.config';

// import passport from 'passport';
// import { PassportConfiguration } from '@config/passport.config';

import { Resolver } from '@middlewares/resolver.middleware';
// import { MySQLServer } from '@/servers/mysql.server';
import { RedisServer } from '@/servers/redis.server';
import { randomUUID } from 'node:crypto';
// import passport from 'passport';
import fastifyPassport from '@fastify/passport';

import { PassportConfiguration } from './passport.config';
import fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyCompress from '@fastify/compress';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';

import { Logger } from '@/api/services/logger.service';
import {
  ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { ZodError } from 'zod';

/**
 * Instanciate and set Express application.
 * Configure and plug middlewares from local options or dedicated files in ./config.
 */
export class Application {
  /**
   * @description Wrapped Express.js application
   */
  public app: FastifyInstance;
  /**
   * @description Store for sessions
   */
  private redisStore: RedisStore;

  constructor() {
    this.init();
    this.createSessionStore();
    // this.createStore();
    this.plug();
  }

  /**
   * @description Instantiate Express application
   */
  private init(): void {
    this.app = fastify({
      logger: Logger.getInstance().pino,
      trustProxy: true,
    });
  }

  /***
   * @description Instantiate session store with redis
   */
  private createSessionStore(): void {
    const redis = RedisServer.client;
    this.redisStore = new RedisStore({
      client: redis,
      prefix: 'btree_sess:',
    });
  }

  /***
   * @description Instantiate session store with knex
   */
  /*
  private createStore(): void {
    const knex = MySQLServer.knex;
    this.store = new KnexSessionStore({
      knex,
      createtable: false,
      clearInterval: 1000 * 60 * 60,
    });
  }
  */

  /**
   * @description Plug and set middlewares on Express app
   */
  private plug(): void {
    /**
     * Check headers validity
     */
    // this.app.use(Kors.validate);

    /**
     * Expose body on req.body
     *
     * @see https://www.npmjs.com/package/body-parser
     */
    /*this.app.use(
      BodyParser.urlencoded({
        limit: '50mb',
        extended: false,
        parameterLimit: 10000,
      }),
    );
    this.app.use(BodyParser.json({ type: contentType, limit: '50mb' }));*/
    /**
     * Prevent request parameter pollution
     *
     * @see https://www.npmjs.com/package/hpp
     */
    // this.app.use(Hpp({ checkBody: false, whitelist: ['order', 'direction'] }));

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
     * Enable CORS - Cross Origin Resource Sharing
     *
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
        let error = null;

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
          error = notAcceptable(`Domain not allowed by CORS: ${origin}`);
        }
        callback(error, corsOptions);
      };
    });

    /*
    this.app.use(
      session({
        name:
          env === ENVIRONMENT.staging
            ? '_auth-btree-session-staging'
            : '_auth-btree-session',
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        rolling: true,
        store: this.store,
        cookie: {
          sameSite: 'strict',
          maxAge: 1000 * 60 * 60 * 24 * 60, // 60 days
          secure: env === ENVIRONMENT.production,
          domain: env === ENVIRONMENT.production ? 'btree.at' : '',
        },
      })
    );
    */
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
     * Passport configuration
     *
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

    //passport.use('jwt', PassportConfiguration.factory('jwt'));

    /**
     * Request logging with Morgan
     * dev : console | production : file
     *
     * @see https://github.com/expressjs/morgan
     */
    // this.app.use(Morgan(httpLogs, { stream: this.options.stream }));

    /**
     * Configure API Rate limit
     * Note that you can also set limit on specific route path
     *
     * @see https://www.npmjs.com/package/express-rate-limit
     */
    // this.app.enable('trust proxy'); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)

    /**
     * Set global middlewares on Express Application
     *
     * Note also that middlewares are implemented in each route file (Guard, Validation, Upload, ...)
     *
     * - RateLimit
     * - Router(s)
     * - Resolver
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

    /*this.app.register(
      `/api/${version}`,
      Container.resolve('ProxyRouter').router,
      // Resolver.resolve,
    );*/

    /**
     * Disable cache header
     */
    // this.app.disable('etag');

    // this.app.use(Catcher.log, Catcher.exit, Catcher.notFound); // Log, exit with error || exit with 404

    this.app.register(require('../api/routes'), {
      prefix: '/api/',
    });

    this.app.ready();
  }
}
