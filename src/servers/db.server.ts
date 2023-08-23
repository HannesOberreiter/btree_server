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
  private logger = Logger.getInstance();

  knex: Knex.Knex;

  static getInstance(): DatabaseServer {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  private constructor() {
    this.knex = Knex.knex(knexConfig);
  }

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
  async stop(): Promise<void> {
    try {
      this.logger.log('debug', 'Closing database connection', {});
      await this.knex.destroy();
      this.logger.log('debug', 'Closed database connection', {});
    } catch (error) {
      this.logger.log('error', 'Database closing error', { error });
    }
  }
}
