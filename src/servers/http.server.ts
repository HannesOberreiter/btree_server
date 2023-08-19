import { FastifyInstance } from 'fastify';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';

import { env, isContainer, port } from '../config/environment.config.js';
import { Cron } from '../services/cron.service.js';
import { Logger } from '../services/logger.service.js';
import { ENVIRONMENT } from '../config/constants.config.js';

/**
 * @description Application server wrapper instance
 */
export class HTTPServer {
  private logger = Logger.getInstance();
  private cron = Cron.getInstance();

  http: HttpServer | HttpsServer;
  app: FastifyInstance;

  constructor(app: FastifyInstance) {
    this.app = app;
    this.http = this.app.server;
  }

  start(): void {
    try {
      const app = this.app;
      const logger = this.logger;
      const containerHost = isContainer ? '0.0.0.0' : 'localhost';
      app.listen(
        {
          port,
          host: containerHost,
        },
        function (err, address) {
          if (err) {
            logger.log('error', 'Server creation error', { err });
            process.exit(1);
          }
          if (env !== ENVIRONMENT.test) {
            logger.log(
              'debug',
              `HTTP(S) server is now running on ${address} (${env})`,
              {},
            );
          }
        },
      );
    } catch (error) {
      this.logger.log('error', 'Failed to create server', error);
    }

    try {
      this.cron.start();
    } catch (error) {
      this.logger.log('error', 'Failed to start cron jobs', error);
    }
  }

  async stop(): Promise<void> {
    this.app.log.debug('Stopping HTTP server');
    await this.cron.gracefulShutdown();
    await this.app.close();
    this.app.log.debug('HTTP server stopped');
    return;
  }
}
