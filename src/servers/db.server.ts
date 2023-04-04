import { ENVIRONMENT } from '@/api/types/constants/environment.const';
import { env, knexConfig } from '@config/environment.config';
import { Container } from '@config/container.config';
import Knex from 'knex';
import { Model } from 'objection';

/**
 * Database connection manager for MariaDb server
 */
export class DatabaseServer {
  static knex = Knex(knexConfig);
  start(): void {
    try {
      Model.knex(DatabaseServer.knex);

      if (env !== ENVIRONMENT.test) {
        Container.resolve('Logger').log(
          'info',
          `Connection to database established on port ${knexConfig.connection.port} (${env})`,
          { label: 'Database' }
        );
      }
    } catch (error) {
      Container.resolve('Logger').log(
        'error',
        `Database connection error : ${error.message}`,
        { label: 'Database' }
      );
    }
  }
  stop(): void {
    try {
      DatabaseServer.knex.destroy();
    } catch (error) {
      console.error(error);
    }
  }
}
