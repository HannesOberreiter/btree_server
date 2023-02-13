import { ENVIRONMENT } from '@/api/types/constants/environment.const';
import { env, redisConfig } from '@config/environment.config';
import { Container } from '@config/container.config';
import Redis from 'ioredis';

/**
 * Connection to redis docker instance
 */
export class RedisServer {
  static client: Redis;
  start(): void {
    try {
      RedisServer.client = new Redis(redisConfig.port, redisConfig.host, {
        connectionName: 'btreeSession',
        username: redisConfig.user,
        password: redisConfig.password,
        enableOfflineQueue: false,
      });
      RedisServer.client.on('connect', () => {
        if (env !== ENVIRONMENT.test) {
          Container.resolve('Logger').log(
            'info',
            `Connection to redis server established on port ${redisConfig.port} (${env})`,
            { label: 'Redis' }
          );
        }
      });
    } catch (error) {
      Container.resolve('Logger').log(
        'error',
        `Redis connection error : ${error.message}`,
        { label: 'Redis' }
      );
    }
  }
  stop(): void {
    try {
      RedisServer.client.save();
      RedisServer.client.quit();
    } catch (error) {
      console.error(error);
    }
  }
}
