import { ENVIRONMENT } from '@enums/environment.enum';
import { env, knexConfig } from '@config/environment.config';
import { Container } from '@config/container.config';
import Knex from 'knex';
import { Model } from 'objection';

/**
 * Database connection manager for MySQL server
 */
export class MySQLServer {
  static knex = Knex(knexConfig);
  start(): void {
    try {
      Model.knex(MySQLServer.knex);

      if (env !== ENVIRONMENT.test) {
        Container.resolve('Logger').log(
          'info',
          `Connection to MySQL server established on port ${knexConfig.connection.port} (${env})`,
          { label: 'MySQL' }
        );
      }
    } catch (error) {
      Container.resolve('Logger').log(
        'error',
        `MySQL connection error : ${error.message}`,
        { label: 'MySQL' }
      );
    }
  }
  stop(): void {
    try {
      MySQLServer.knex.destroy();
    } catch (error) {
      console.error(error);
    }
  }
}
