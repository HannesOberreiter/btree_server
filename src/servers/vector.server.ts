import type { RedisOptions } from 'ioredis';
import { Redis } from 'ioredis';

import { ENVIRONMENT } from '../config/constants.config.js';
import { env, vectorConfig } from '../config/environment.config.js';
import { Logger } from '../services/logger.service.js';

/**
 * @description Connection to redis docker instance
 */
export class VectorServer {
  private logger = Logger.getInstance();
  static client: Redis;

  start(): void {
    try {
      const config: RedisOptions = {
        connectionName: 'btreeVector',
        enableOfflineQueue: false,
      };
      if (vectorConfig.password) {
        config.username = vectorConfig.user;
        config.password = vectorConfig.password;
      }
      VectorServer.client = new Redis(
        vectorConfig.port,
        vectorConfig.host,
        config,
      );
      VectorServer.client.on('connect', () => {
        if (env !== ENVIRONMENT.test) {
          this.logger.log(
            'debug',
            `Connection to redis (vector) server established on port ${vectorConfig.port} (${env})`,
            { label: 'Vector' },
          );
        }
      });
    }
    catch (error) {
      this.logger.log('error', `Redis connection error : ${error.message}`, {
        label: 'Vector',
      });
    }
  }

  async stop(): Promise<void> {
    try {
      this.logger.log('debug', 'Closing redis (vector) connection', {});
      await VectorServer.client.save();
      await VectorServer.client.quit();
      this.logger.log('debug', 'Closed redis (vector) connection', {});
    }
    catch (error) {
      this.logger.log('error', 'Redis (vector) closing error', { error });
    }
  }
}
