import { ENVIRONMENT } from '@/api/types/constants/environment.const';
import { env, vectorConfig } from '@config/environment.config';
import { Container } from '@config/container.config';
import Redis, { RedisOptions } from 'ioredis';

/**
 * Connection to redis docker instance
 */
export class VectorServer {
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
          Container.resolve('Logger').log(
            'info',
            `Connection to redis (vector) server established on port ${vectorConfig.port} (${env})`,
            { label: 'Vector' },
          );
        }
      });
    } catch (error) {
      Container.resolve('Logger').log(
        'error',
        `Redis connection error : ${error.message}`,
        { label: 'Vector' },
      );
    }
  }
  stop(): void {
    try {
      VectorServer.client.save();
      VectorServer.client.quit();
    } catch (error) {
      console.error(error);
    }
  }
}
