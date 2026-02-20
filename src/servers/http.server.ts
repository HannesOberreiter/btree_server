import type { FastifyInstance } from 'fastify';
import type { Server as HttpServer } from 'node:http';
import type { Server as HttpsServer } from 'node:https';

import { ENVIRONMENT } from '../config/constants.config.js';
import { env, isContainer, port } from '../config/environment.config.js';
import { Cron } from '../services/cron.service.js';
import { Logger } from '../services/logger.service.js';

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

  async start(): Promise<void> {
    try {
      const app = this.app;
      const logger = this.logger;
      const containerHost = isContainer ? '0.0.0.0' : 'localhost';
      const address = await app.listen(
        {
          port,
          host: containerHost,
        },
      );
      if (env !== ENVIRONMENT.test) {
        logger.log(
          'debug',
          `HTTP(S) server is now running on ${address} (${env})`,
          {},
        );
      }
    }
    catch (error) {
      this.logger.log('error', 'Failed to create server', error);
    }

    try {
      this.cron.start();
    }
    catch (error) {
      this.logger.log('error', 'Failed to start cron jobs', error);
    }
  }

  async stop(): Promise<void> {
    this.app.log.debug('Stopping HTTP server');
    await this.cron.gracefulShutdown();
    await this.app.close();
    this.app.log.debug('HTTP server stopped');
  }
}
