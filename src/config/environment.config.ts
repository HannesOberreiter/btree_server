import { Buffer } from 'node:buffer';
import process from 'node:process';
import dotenv from 'dotenv';
import { ENVIRONMENT } from './constants.config.js';

const rootDirectory = new URL('../../', import.meta.url).pathname;

/**
 * @description Configure dotenv with variables.env file before app
 * @dependency dotenv
 * @see https://www.npmjs.com/package/dotenv
 */
class EnvironmentConfiguration {
  /**
   * @description Current environment (default dev)
   */
  static environment: keyof typeof ENVIRONMENT = ENVIRONMENT.development;

  static server: 'eu' | 'us' = 'eu';

  /**
   * @description Set environment according to current process args
   */
  static set() {
    if (
      process.argv[2]
      && process.argv[2] === '--env'
      && process.argv[3]
      // eslint-disable-next-line no-prototype-builtins
      && ENVIRONMENT.hasOwnProperty(process.argv[3])
    ) {
      this.environment = ENVIRONMENT[process.argv[3]];
    }
    else if (
      process.env.ENVIRONMENT
      // eslint-disable-next-line no-prototype-builtins
      && ENVIRONMENT.hasOwnProperty(process.env.ENVIRONMENT)
    ) {
      this.environment = process.env.ENVIRONMENT as keyof typeof ENVIRONMENT;
    }
    if (process.env.SERVER && ['eu', 'us'].includes(process.env.SERVER)) {
      this.server = process.env.SERVER as 'eu' | 'us';
    }
  }

  /**
   * @description Load .env file according to environment
   */
  static load() {
    this.set();
    // https://www.npmjs.com/package/dotenv
    const result = dotenv.config({
      path:
        `${rootDirectory
        }/env/${this.environment + (this.server === 'eu' ? '' : `-${this.server}`)}.env`,
    });
    if (result.error) {
      throw result.error;
    }
  }
}

EnvironmentConfiguration.load();

const env = EnvironmentConfiguration.environment;
const port = Number.parseInt(process.env.PORT);
const url = process.env.URL;
const frontend = process.env.FRONTEND;
const authorized = process.env.AUTHORIZED;
const isContainer = !!process.env.CONTAINER; // Docker container, we need to use different ports
const isChild = process.env.IS_CHILD ? process.env.IS_CHILD === 'true' : false; // Child node application, used for scaling, without cronjobs

const sessionSecret = process.env.SESSION_SECRET;

const meteoblueKey = process.env.METEOBLUE_KEY;

const dropboxClientId = process.env.DROPBOX_CLIENT_ID;
const dropboxClientSecret = process.env.DROPBOX_CLIENT_SECRET;

const paypalClientId = process.env.PAYPAL_CLIENT_ID;
const paypalAppSecret = process.env.PAYPAL_APP_SECRET;
const paypalBase
  = env === ENVIRONMENT.production
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const stripeSecret = process.env.STRIPE_SECRET_KEY;

const mollieApiKey = process.env.MOLLIE_API_KEY;

const discourseSecret = process.env.DISCOURSE_SSO;

const foxyOfficeKey = process.env.FOXY_OFFICE_KEY;
const foxyOfficeUrl = process.env.FOXY_OFFICE_URL;

const googleOAuth = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
};

const basicLimit = {
  hive: Number.parseInt(process.env.LIMIT_HIVE),
  apiary: Number.parseInt(process.env.LIMIT_APIARY),
  scale: Number.parseInt(process.env.LIMIT_SCALE),
};

const totalLimit = {
  hive: Number.parseInt(process.env.TOTAL_LIMIT_HIVE),
  apiary: Number.parseInt(process.env.TOTAL_LIMIT_APIARY),
  scale: Number.parseInt(process.env.TOTAL_LIMIT_SCALE),
};

const cronjobTimer = process.env.CRONJOB ? process.env.CRONJOB : '0 11 */1 * *';

const redisConfig = {
  host: process.env.REDIS_HOSTNAME,
  port: Number.parseInt(process.env.REDIS_PORT),
  user: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD ?? '',
};

const vectorConfig = {
  host: process.env.VECTOR_HOSTNAME,
  port: Number.parseInt(process.env.VECTOR_PORT),
  user: process.env.VECTOR_USERNAME,
  password: process.env.VECTOR_PASSWORD ?? '',
};

/**
 * @type {Knex}
 */
const knexConfig = {
  client: process.env.DB_TYPE,
  connection: {
    host: process.env.DB_HOSTNAME,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: Number.parseInt(process.env.DB_PORT),
    charset: 'utf8mb4',
    timezone: 'UTC',
    typeCast(field, next) {
      // https://github.com/Vincit/objection.js/issues/174#issuecomment-424873063
      // Convert 1 to true, 0 to false, and leave null alone
      if (field.type === 'TINY' && field.length === 1) {
        const value = field.string();
        if (value === null)
          return null;
        return value === '1';
      }
      return next();
    },
  },
  debug: env === ENVIRONMENT.development,
  pool: {
    min: Number.parseInt(process.env.DB_POOL_MIN),
    max: Number.parseInt(process.env.DB_POOL_MAX),
    afterCreate(conn, done) {
      // Extend max group concant mainly for calendar view if many ids are concated
      conn.query('SET SESSION group_concat_max_len = 100000;', (err) => {
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
  secure: process.env.MAIL_SECURE === 'true',
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
            'ascii',
          ),
  },
};

const openAI = {
  key: process.env.OPEN_AI_KEY ?? '',
  dailyUserTokenLimit: Number.parseInt(
    process.env.OPEN_AI_DAILY_USER_TOKEN_LIMIT ?? '0',
  ),
};

const serverLocations = ['eu', 'us'];
function isServerLocationValid(server: string) {
  return serverLocations.includes(server);
}
const serverLocation = isServerLocationValid(process.env.SERVER_LOCATION)
  ? process.env.SERVER_LOCATION
  : 'eu';

export {
  authorized,
  basicLimit,
  cronjobTimer,
  discourseSecret,
  dropboxClientId,
  dropboxClientSecret,
  env,
  foxyOfficeKey,
  foxyOfficeUrl,
  frontend,
  googleOAuth,
  isChild,
  isContainer,
  isServerLocationValid,
  knexConfig,
  mailConfig,
  meteoblueKey,
  mollieApiKey,
  openAI,
  paypalAppSecret,
  paypalBase,
  paypalClientId,
  port,
  redisConfig,
  rootDirectory,
  serverLocation,
  sessionSecret,
  stripeSecret,
  totalLimit,
  url,
  vectorConfig,
};
