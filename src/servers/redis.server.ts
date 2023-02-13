import { ENVIRONMENT } from '@/api/types/constants/environment.const';
import { env, redisConfig } from '@config/environment.config';
import { Container } from '@config/container.config';
import Redis, { RedisOptions } from 'ioredis';

/**
 * Connection to redis docker instance
 */
export class RedisServer {
  static client: Redis;
  start(): void {
    try {
      const config: RedisOptions = {
        connectionName: 'btreeSession',
        enableOfflineQueue: false,
      };
      if (redisConfig.password) {
        config['username'] = redisConfig.user;
        config['password'] = redisConfig.password;
      }
      RedisServer.client = new Redis(
        redisConfig.port,
        redisConfig.host,
        config
      );
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
