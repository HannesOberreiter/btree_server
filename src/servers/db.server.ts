import { env, knexConfig } from '@config/environment.config';
import Knex from 'knex';
import { Model } from 'objection';
import { Logger } from '@/api/services/logger.service';
import { ENVIRONMENT } from '@/config/constants.config';

/**
 * Database connection manager for MariaDb server
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
          'info',
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
