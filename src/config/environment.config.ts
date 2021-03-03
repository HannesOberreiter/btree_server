import { ENVIRONMENT } from '@enums/environment.enum';
import { list } from '@utils/enum.util';
import p from 'path';

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
  static environment: string = ENVIRONMENT.development;

  /**
   * @description Set environment according to current process args
   */
  static set() {
    if (process.argv[2] && process.argv[2] === '--env' && process.argv[3] && ENVIRONMENT.hasOwnProperty(process.argv[3]) ) {
      this.environment = ENVIRONMENT[process.argv[3]];
    }
    if (process.env.ENVIRONMENT && ENVIRONMENT.hasOwnProperty(process.env.ENVIRONMENT) ) {
      this.environment = process.env.ENVIRONMENT as ENVIRONMENT;
    }
  }

  /**
   * @description Load .env file according to environment
   */
  static load() {
    this.set();
    // https://www.npmjs.com/package/dotenv
    const dotenv = require('dotenv');
    const result = dotenv.config( { path : p.join(__dirname, `../../env/${this.environment}.env`) } );
    if (result.error) {
      throw result.error
    }
  }
}

EnvironmentConfiguration.load();

const env                   = process.env.NODE_ENV;
const version               = process.env.API_VERSION;
const port                  = process.env.PORT;
const url                   = process.env.URL;
const authorized            = process.env.AUTHORIZED;
const jwtSecret             = process.env.JWT_SECRET;
const jwtExpirationInterval = process.env.JWT_EXPIRATION_MINUTES;
const logs                  = process.env.NODE_ENV === 'production' ? 'combined' : 'development';
const httpLogs              = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
const contentType           = process.env.CONTENT_TYPE;

const knexConfig =  {
    client: process.env.DB_TYPE,
    connection: {
      host: process.env.DB_HOSTNAME,
      database: process.env.DB_NAME ,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT),
    },
    debug: process.env.NODE_ENV === ENVIRONMENT.production ? false : true,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN),
      max: parseInt(process.env.DB_POOL_MAX)
    },
    migrations: {
      directory: 'db/migrations',
      tableName: 'KnexMigrations',
    },
    seeds: {
      directory: 'db/seeds',
    }
  };


const ssl                 = {
  isActive: parseInt(process.env.HTTPS_IS_ACTIVE, 10),
  key: process.env.HTTPS_KEY,
  cert: process.env.HTTPS_CERT
};

export { knexConfig, env, port, url, authorized, contentType, ssl, jwtSecret, jwtExpirationInterval, version, logs, httpLogs };