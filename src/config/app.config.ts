import Cors from 'cors';
import * as rfs from 'rotating-file-stream';
import { ENVIRONMENT } from '@enums/environment.enum';
import {
  httpLogs,
  authorized,
  version,
  env,
  contentType,
  sessionSecret,
} from '@config/environment.config';
import p from 'path';

import Express from 'express';
import session from 'express-session';

import Hpp from 'hpp';
import BodyParser from 'body-parser';
import { Cors as Kors } from '@middlewares/cors.middleware';
import Compression from 'compression';
import RateLimit from 'express-rate-limit';
import Morgan from 'morgan';

//import passport from 'passport';

import { notAcceptable } from '@hapi/boom';

import { Container } from '@config/container.config';

import { HelmetConfiguration } from '@config/helmet.config';

// import { PassportConfiguration } from '@config/passport.config';

import { Resolver } from '@middlewares/resolver.middleware';
import { Catcher } from '@middlewares/catcher.middleware';

import { MySQLServer } from '@/servers/mysql.server';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const KnexSessionStore = require('connect-session-knex')(session);

/**
 * Instanciate and set Express application.
 * Configure and plug middlewares from local options or dedicated files in ./config.
 */
export class Application {
  /**
   * @description Wrapped Express.js application
   */
  public app: Express.Application;
  /**
   * @description Store for sessions
   */
  private store: any;

  /**
   * @description Configuring CORS asynchronously, will disable CORS for /external/ route
   */
  private corsOptionsDelegate = function (req, callback) {
    const origin = req.header('Origin');
    let corsOptions = {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: [
        'Accept',
        'Content-Type',
        'Authorization',
        'Origin',
        'From',
      ],
    } as any;
    let error = null;

    if (req.url.indexOf('external') !== -1) {
      // Allow API calls to scale and iCal without CORS
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
  /**
   * @description Middlewares options
   */
  private options = {
    stream:
      env === ENVIRONMENT.production
        ? rfs.createStream('access.log', {
            interval: '7d',
            maxFiles: 10,
            path: p.join(__dirname, `../../logs`),
          })
        : Container.resolve('Logger').get('stream'),
    rate: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 2500,
      message: 'Too many requests from this IP, please try again after an hour',
    },
  };

  constructor() {
    this.init();
    this.createStore();
    this.plug();
  }

  /**
   * @description Instantiate Express application
   */
  private init(): void {
    this.app = Express();
  }

  /***
   * @description Instantiate session store with knex
   */
  private createStore(): void {
    const knex = MySQLServer.knex;
    this.store = new KnexSessionStore({
      knex,
      createtable: false,
      clearInterval: 1000 * 60 * 60,
    });
  }

  /**
   * @description Plug and set middlewares on Express app
   */
  private plug(): void {
    /**
     * Check headers validity
     */
    this.app.use(Kors.validate);

    /**
     * Expose body on req.body
     *
     * @see https://www.npmjs.com/package/body-parser
     */
    this.app.use(
      BodyParser.urlencoded({
        limit: '50mb',
        extended: false,
        parameterLimit: 10000,
      })
    );
    this.app.use(BodyParser.json({ type: contentType, limit: '50mb' }));
    /**
     * Prevent request parameter pollution
     *
     * @see https://www.npmjs.com/package/hpp
     */
    this.app.use(Hpp({ checkBody: false, whitelist: ['order', 'direction'] }));

    /**
     * GZIP compression
     *
     * @see https://github.com/expressjs/compression
     */
    this.app.use(Compression());

    /**
     * Enable and set Helmet security middleware
     *
     * @see https://github.com/helmetjs/helmet
     */
    this.app.use(HelmetConfiguration.get()());

    /**
     * Enable CORS - Cross Origin Resource Sharing
     *
     * @see https://www.npmjs.com/package/cors
     */
    this.app.use(Cors(this.corsOptionsDelegate));

    this.app.use(
      session({
        name: 'btree-session',
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        rolling: true,
        store: this.store,
        cookie: {
          sameSite: 'lax',
          maxAge: 1000 * 60 * 60 * 24 * 60, // 60 days
          secure: env === ENVIRONMENT.production,
          domain: env === ENVIRONMENT.production ? 'btree.at' : '',
        },
      })
    );

    /**
     * Passport configuration
     *
     * @see http://www.passportjs.org/
     */
    // this.app.use(passport.initialize());
    // this.app.use(
    //  passport.use('session', PassportConfiguration.factory('session'))
    // );
    //passport.use('jwt', PassportConfiguration.factory('jwt'));

    /**
     * Request logging with Morgan
     * dev : console | production : file
     *
     * @see https://github.com/expressjs/morgan
     */
    this.app.use(Morgan(httpLogs, { stream: this.options.stream }));

    /**
     * Configure API Rate limit
     * Note that you can also set limit on specific route path
     *
     * @see https://www.npmjs.com/package/express-rate-limit
     */
    this.app.enable('trust proxy'); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)

    /**
     * Set global middlewares on Express Application
     *
     * Note also that middlewares are implemented in each route file (Guard, Validation, Upload, ...)
     *
     * - RateLimit
     * - Router(s)
     * - Resolver
     */
    this.app.use(
      `/api/${version}`,
      RateLimit(this.options.rate),
      Container.resolve('ProxyRouter').router,
      Resolver.resolve
    );

    /**
     * Disable cache header
     */
    this.app.disable('etag');

    this.app.use(Catcher.log, Catcher.exit, Catcher.notFound); // Log, exit with error || exit with 404
  }
}
