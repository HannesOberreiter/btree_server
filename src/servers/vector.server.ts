import { env, vectorConfig } from '@config/environment.config';
import Redis, { RedisOptions } from 'ioredis';
import { Logger } from '@/api/services/logger.service';
import { ENVIRONMENT } from '@/config/constants.config';

/**
 * Connection to redis docker instance
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
        config['username'] = vectorConfig.user;
        config['password'] = vectorConfig.password;
      }
      VectorServer.client = new Redis(
        vectorConfig.port,
        vectorConfig.host,
        config,
      );
      VectorServer.client.on('connect', () => {
        if (env !== ENVIRONMENT.test) {
          this.logger.log(
            'info',
            `Connection to redis (vector) server established on port ${vectorConfig.port} (${env})`,
            { label: 'Vector' },
          );
        }
      });
    } catch (error) {
      this.logger.log('error', `Redis connection error : ${error.message}`, {
        label: 'Vector',
      });
    }
  }
  stop(): void {
    try {
      VectorServer.client.save();
      VectorServer.client.quit();
    } catch (error) {
      this.logger.log('error', 'Redis connection error', { error });
    }
  }
}
