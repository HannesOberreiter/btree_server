import { ENVIRONMENT } from '@enums/environment.enum';
import {
  httpLogs,
  authorized,
  version,
  env,
  contentType
} from '@config/environment.config';
import p from 'path';

import Express from 'express';
import Hpp from 'hpp';
import BodyParser from 'body-parser';
import Cors from 'cors';
import Compression from 'compression';
import RateLimit from 'express-rate-limit';
import Morgan from 'morgan';

import { createWriteStream } from 'fs';
//import { initialize as PassportInitialize, use as PassportUse } from 'passport';
//import * as Passport from 'passport';
import passport from 'passport';

import { notAcceptable } from 'boom';

import { Container } from '@config/container.config';

import { HelmetConfiguration } from '@config/helmet.config';

import { PassportConfiguration } from '@config/passport.config';

import { Header } from '@middlewares/header.middleware';
import { Resolver } from '@middlewares/resolver.middleware';
import { Catcher } from '@middlewares/catcher.middleware';

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
   * @description Middlewares options
   */
  private options = {
    cors: {
      origin: (origin, callback) => {
        if (authorized.indexOf(origin) !== -1 || !origin) {
          callback(null, true);
        } else {
          callback(notAcceptable(`Domain not allowed by CORS: ${origin}`));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: [
        'Accept',
        'Content-Type',
        'Authorization',
        'Origin',
        'From'
      ]
    },
    stream:
      env === ENVIRONMENT.production
        ? createWriteStream(p.join(__dirname, `../../logs/access.log`), {
            flags: 'a+'
          })
        : Container.resolve('Logger').get('stream'),
    rate: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 2500,
      message: 'Too many requests from this IP, please try again after an hour'
    }
  };

  constructor() {
    this.init();
    this.plug();
  }

  /**
   * @description Instantiate Express application
   */
  private init(): void {
    this.app = Express();
  }

  /**
   * @description Plug and set middlewares on Express app
   */
  private plug(): void {
    /**
     * First, before all : check headers validity
     *
     */
    this.app.use(Header.check({ contentType }));

    /**
     * Expose body on req.body
     *
     * @see https://www.npmjs.com/package/body-parser
     */
    this.app.use(
      BodyParser.urlencoded({
        limit: '50mb',
        extended: true,
        parameterLimit: 10000
      })
    );
    this.app.use(BodyParser.json({ type: contentType, limit: '50mb' }));
    /**
     * Prevent request parameter pollution
     *
     * @see https://www.npmjs.com/package/hpp
     */
    this.app.use(Hpp({ checkBody: false }));

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
    this.app.use(Cors(this.options.cors));

    /**
     * Passport configuration
     *
     * @see http://www.passportjs.org/
     */
    //this.app.use(PassportInitialize());
    //PassportUse('jwt', PassportConfiguration.factory('jwt'));
    this.app.use(passport.initialize());
    passport.use('jwt', PassportConfiguration.factory('jwt'));

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

    this.app.use(Catcher.log, Catcher.exit, Catcher.notFound); // Log, exit with error || exit with 404
  }
}
