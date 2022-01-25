import { ENVIRONMENT } from '@enums/environment.enum';
import { env, port, mailConfig } from '@config/environment.config';

import * as Express from 'express';

import { readFileSync } from 'fs';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer, createServer } from 'https';

import { Container } from '@config/container.config';

/**
 * Application server wrapper instance
 */
export class HTTPServer {
  /**
   *
   */
  http: HttpServer | HttpsServer;

  /**
   *
   */
  app: Express.Application;

  /**
   *
   */
  private options = {
    port: port
  };

  constructor(app: Express.Application) {
    this.app = app;
  }

  /**
   * @description Start servers
   */
  start(): void {
    try {
      const server = this.app;
      this.http = server.listen(port, function () {
        if (env !== ENVIRONMENT.test) {
          Container.resolve('Logger').log(
            'info',
            `HTTP(S) server is now running on port ${port} (${env})`,
            { label: 'Server' }
          );
        }
      });
    } catch (error) {
      Container.resolve('Logger').log(
        'error',
        `Server creation error : ${error.message}`,
        { label: 'Server' }
      );
    }
  }
}
