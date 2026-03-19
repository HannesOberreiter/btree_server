import { createClient } from 'redis';

import { ENVIRONMENT } from '../config/constants.config.js';
import { env, redisConfig } from '../config/environment.config.js';
import { Logger } from '../services/logger.service.js';

type RedisClient = ReturnType<typeof createClient>;

/**
 * @description Connection to redis docker instance
 */
export class RedisServer {
  private logger = Logger.getInstance();
  static client: RedisClient;

  async start(): Promise<void> {
    try {
      RedisServer.client = createClient({
        socket: {
          port: redisConfig.port,
          host: redisConfig.host,
        },
        name: 'btreeSession',
        ...(redisConfig.password && {
          username: redisConfig.user,
          password: redisConfig.password,
        }),
      });

      RedisServer.client.on('error', (error) => {
        this.logger.log('error', `Redis connection error : ${error.message}`, {
          label: 'Redis',
        });
      });

      await RedisServer.client.connect();

      if (env !== ENVIRONMENT.test) {
        this.logger.log(
          'debug',
          `Connection to redis (session) server established on port ${redisConfig.port} (${env})`,
          { label: 'Redis' },
        );
      }
    }
    catch (error) {
      this.logger.log('error', `Redis connection error : ${error.message}`, {
        label: 'Redis',
      });
    }
  }

  async stop(): Promise<void> {
    try {
      this.logger.log('debug', 'Closing redis connection', {});
      await RedisServer.client.save();
      await RedisServer.client.quit();
      this.logger.log('debug', 'Closed redis connection', {});
    }
    catch (error) {
      this.logger.log('error', 'Redis closing error', { error });
    }
  }
}
