import { env, redisConfig } from '@config/environment.config';
import Redis, { RedisOptions } from 'ioredis';
import { Logger } from '@/api/services/logger.service';
import { ENVIRONMENT } from '@/config/constants.config';

/**
 * Connection to redis docker instance
 */
export class RedisServer {
  private logger = Logger.getInstance();
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
        config,
      );
      RedisServer.client.on('connect', () => {
        if (env !== ENVIRONMENT.test) {
          this.logger.log(
            'info',
            `Connection to redis (session) server established on port ${redisConfig.port} (${env})`,
            { label: 'Redis' },
          );
        }
      });
    } catch (error) {
      this.logger.log('error', `Redis connection error : ${error.message}`, {
        label: 'Redis',
      });
    }
  }
  stop(): void {
    try {
      RedisServer.client.save();
      RedisServer.client.quit();
    } catch (error) {
      this.logger.log('error', 'Redis connection error', { error });
    }
  }
}
