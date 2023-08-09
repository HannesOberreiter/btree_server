import { FastifyInstance } from 'fastify';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';

import { env, isContainer, port } from '../config/environment.config.js';
import { task } from '../cron/scheduler.js';
import { Logger } from '../services/logger.service.js';
import { ENVIRONMENT } from '../config/constants.config.js';

/**
 * @description Application server wrapper instance
 */
export class HTTPServer {
  private logger = Logger.getInstance();
  http: HttpServer | HttpsServer;
  app: FastifyInstance;

  constructor(app: FastifyInstance) {
    this.app = app;
    this.http = this.app.server;
  }

  /**
   * @description Start servers
   */
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
            app.log.debug(
              `HTTP(S) server is now running on ${address} (${env})`,
            );
          }
        },
      );

      /**
       * @description Start Cron Jobs
       */
      task.start();
      task.nextRun();
    } catch (error) {
      this.logger.log('error', 'Failed to create server', error);
    }
  }

  /**
   * @description stop servers
   */
  stop(callback = null): HttpServer | HttpsServer {
    task.stop();
    this.app.log.info('Stopping server');
    return this.app.close(callback);
  }
}
