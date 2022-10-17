import { ENVIRONMENT } from '@enums/environment.enum';
import p from 'path';
import dotenv from 'dotenv';

/**
 * Configure dotenv with variables.env file before app, to allow process.env accessibility in
 * app.js
 *
 * @dependency dotenv
 *
 * @see https://www.npmjs.com/package/dotenv
 */
class EnvironmentConfiguration {
  /**
   * @description Current environment (default dev)
   */
  static environment: ENVIRONMENT = ENVIRONMENT.development;

  /**
   * @description Set environment according to current process args
   */
  static set() {
    if (
      process.argv[2] &&
      process.argv[2] === '--env' &&
      process.argv[3] &&
      // eslint-disable-next-line no-prototype-builtins
      ENVIRONMENT.hasOwnProperty(process.argv[3])
    ) {
      this.environment = ENVIRONMENT[process.argv[3]];
    } else if (
      process.env.ENVIRONMENT &&
      // eslint-disable-next-line no-prototype-builtins
      ENVIRONMENT.hasOwnProperty(process.env.ENVIRONMENT)
    ) {
      this.environment = process.env.ENVIRONMENT as ENVIRONMENT;
    }
  }

  /**
   * @description Load .env file according to environment
   */
  static load() {
    this.set();
    // https://www.npmjs.com/package/dotenv
    const result = dotenv.config({
      path: p.join(__dirname, `../../env/${this.environment}.env`),
    });
    if (result.error) {
      throw result.error;
    }
  }
}

EnvironmentConfiguration.load();

const env = EnvironmentConfiguration.environment;
const version = process.env.API_VERSION;
const port = process.env.PORT;
const url = process.env.URL;
const frontend = process.env.FRONTEND;
const authorized = process.env.AUTHORIZED;

/*const jwtSecret = process.env.JWT_SECRET;
const jwtExpirationInterval: number = parseFloat(
  process.env.JWT_EXPIRATION_MINUTES
);
const jwtExpirationIntervalRefreshToken: number = parseInt(
  process.env.JWT_REFRESH_DAYS
);*/

const sessionSecret = process.env.SESSION_SECRET;

const logs = env === ENVIRONMENT.production ? 'combined' : 'development';
// https://github.com/expressjs/morgan
const httpLogs = env === ENVIRONMENT.production ? 'tiny' : 'dev';
const contentType = process.env.CONTENT_TYPE;
const meteoblueKey = process.env.METEOBLUE_KEY;

const dropboxClientId = process.env.DROPBOX_CLIENT_ID;
const dropboxClientSecret = process.env.DROPBOX_CLIENT_SECRET;

const paypalClientId = process.env.PAYPAL_CLIENT_ID;
const paypalAppSecret = process.env.PAYPAL_APP_SECRET;
const paypalBase =
  env === ENVIRONMENT.production
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const stripeSecret = process.env.STRIPE_SECRET_KEY;

const basicLimit = {
  hive: parseInt(process.env.LIMIT_HIVE),
  apiary: parseInt(process.env.LIMIT_APIARY),
  scale: parseInt(process.env.LIMIT_SCALE),
};

const totalLimit = {
  hive: parseInt(process.env.TOTAL_LIMIT_HIVE),
  apiary: parseInt(process.env.TOTAL_LIMIT_APIARY),
  scale: parseInt(process.env.TOTAL_LIMIT_SCALE),
};

const cronjobTimer = process.env.CRONJOB ? process.env.CRONJOB : '0 11 */1 * *';

const knexConfig = {
  client: process.env.DB_TYPE,
  connection: {
    host: process.env.DB_HOSTNAME,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT),
    timezone: 'UTC',
    typeCast(field, next) {
      // https://github.com/Vincit/objection.js/issues/174#issuecomment-424873063
      // Convert 1 to true, 0 to false, and leave null alone
      if (field.type === 'TINY' && field.length === 1) {
        const value = field.string();
        return value ? value === '1' : null;
      }
      return next();
    },
  },
  debug: env === ENVIRONMENT.development ? true : false,
  pool: {
    min: parseInt(process.env.DB_POOL_MIN),
    max: parseInt(process.env.DB_POOL_MAX),
    afterCreate: function (conn, done) {
      // Extend max group concant mainly for calendar view if many ids are concated
      conn.query('SET SESSION group_concat_max_len = 100000;', function (err) {
        done(err, conn);
      });
    },
  },
  migrations: {
    directory: 'db/migrations',
    tableName: 'KnexMigrations',
  },
  seeds: {
    directory: 'db/seeds',
  },
};

const mailConfig = {
  host: process.env.MAIL_SMTP,
  port: Number(process.env.MAIL_PORT),
  secure: process.env.MAIL_SECURE === 'true' ? true : false,
  auth: {
    user: process.env.MAIL_FROM,
    pass: process.env.MAIL_PASSWORD,
  },
  dkim: {
    domainName: process.env.MAIL_DKIM_SELECTOR ? 'btree.at' : '',
    keySelector: process.env.MAIL_DKIM_SELECTOR,
    privateKey:
      process.env.MAIL_DKIM_PRIVATE === 'false'
        ? ''
        : Buffer.from(process.env.MAIL_DKIM_PRIVATE, 'base64').toString(
            'ascii'
          ),
  },
};

export {
  knexConfig,
  env,
  port,
  url,
  frontend,
  meteoblueKey,
  authorized,
  contentType,
  //jwtSecret,
  //jwtExpirationInterval,
  //jwtExpirationIntervalRefreshToken,
  version,
  logs,
  httpLogs,
  mailConfig,
  dropboxClientId,
  dropboxClientSecret,
  paypalClientId,
  paypalAppSecret,
  stripeSecret,
  paypalBase,
  basicLimit,
  totalLimit,
  cronjobTimer,
  sessionSecret,
};
