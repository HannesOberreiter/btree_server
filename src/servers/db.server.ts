import Knex from 'knex';
import { Model } from 'objection';

import { env, knexConfig } from '../config/environment.config.js';
import { Logger } from '../services/logger.service.js';
import { ENVIRONMENT } from '../config/constants.config.js';

/**
 * @description Database connection manager for MariaDb server
 */
export class DatabaseServer {
  private static instance: DatabaseServer;
  knex: ReturnType<typeof Knex>;

  static getInstance(): DatabaseServer {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  private constructor() {
    this.knex = Knex(knexConfig);
  }

  private logger = Logger.getInstance();

  start(): void {
    try {
      Model.knex(this.knex);

      if (env !== ENVIRONMENT.test) {
        this.logger.log(
          'debug',
          `Connection to database established on port ${knexConfig.connection.port} (${env})`,
          { label: 'Database' },
        );
      }
    } catch (error) {
      this.logger.log('error', `Database connection error : ${error.message}`, {
        label: 'Database',
      });
    }
  }
  stop(): void {
    try {
      this.knex.destroy();
    } catch (error) {
      this.logger.log('error', 'Database connection error', { error });
    }
  }
}
