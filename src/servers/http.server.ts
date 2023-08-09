import { env, port } from '@config/environment.config';

import { FastifyInstance } from 'fastify';

import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { task } from '@cron/scheduler';
import { Logger } from '@/api/services/logger.service';
import { ENVIRONMENT } from '@/config/constants.config';
// import { Container } from '@config/container.config';

/**
 * Application server wrapper instance
 */
export class HTTPServer {
  private logger = Logger.getInstance();

  /**
   *
   */
  http: HttpServer | HttpsServer;

  /**
   *
   */
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
      app.listen({ port }, function (err, address) {
        if (err) {
          logger.log('error', 'Server creation error', { err });
          process.exit(1);
        }
        if (env !== ENVIRONMENT.test) {
          app.log.debug(`HTTP(S) server is now running on ${address} (${env})`);
          /*Container.resolve('Logger').log(
            'info',
            `HTTP(S) server is now running on ${address} (${env})`,
            { label: 'Server' },
          );*/
        }
      });

      /*this.http = server.listen(port, function () {
        if (env !== ENVIRONMENT.test) {
          Container.resolve('Logger').log(
            'info',
            `HTTP(S) server is now running on port ${port} (${env})`,
            { label: 'Server' },
          );
        }
      });*/
      /**
       * @description Start Cron Jobs
       */
      task.start();
      task.nextRun();
    } catch (error) {
      this.logger.log('error', 'Failed to create server', error);
      /*Container.resolve('Logger').log(
        'error',
        `Server creation error : ${error.message}`,
        { label: 'Server' },
      );*/
    }
  }

  /**
   * @description stop servers
   */
  stop(callback = null): HttpServer | HttpsServer {
    task.stop();
    // return this.http.close(callback);
    this.app.log.info('Stopping server');
    return this.app.close(callback);
  }
}
