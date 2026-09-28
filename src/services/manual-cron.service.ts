import { ENVIRONMENT } from '../config/constants.config.js';
import { env } from '../config/environment.config.js';
import { KyselyServer } from '../servers/kysely.server.js';
import { RedisServer } from '../servers/redis.server.js';
import { Cron } from './cron.service.js';
import { Logger } from './logger.service.js';
import { MailService } from './mail.service.js';

/** Run the main cron job once without starting HTTP or automatic schedules. */
export async function runManualCron(): Promise<void> {
  if (env !== ENVIRONMENT.staging && env !== ENVIRONMENT.development) {
    throw new Error(
      'Manual cron runs are only allowed in staging or development',
    );
  }

  const logger = Logger.getInstance();
  const redis = new RedisServer();
  const database = KyselyServer.getInstance();

  try {
    logger.log('info', `Starting manual ${env} cron run`, {
      label: 'CronJob',
    });
    await redis.start();
    if (!RedisServer.client?.isReady) {
      throw new Error('Redis is not ready');
    }
    await MailService.getInstance().setup();
    await Cron.getInstance().run();
    logger.log('info', `Manual ${env} cron run finished`, {
      label: 'CronJob',
    });
  } finally {
    await Promise.allSettled([redis.stop(), database.stop()]);
    logger.close();
  }
}
