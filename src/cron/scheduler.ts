import cron from 'node-schedule';
import {
  cleanupDatabase,
  reminderPremium,
  reminderDeletion,
  reminderVIS,
} from '@/api/utils/cron.util';
import { cronjobTimer } from '@/config/environment.config';
import { Logger } from '@/api/services/logger.service';

let job: any;

const logger = Logger.getInstance();

function Logging(input: any) {
  logger.log('info', JSON.stringify(input), {
    label: 'CronJob',
  });
}

const task = {
  start: async () => {
    const rule = cronjobTimer;
    logger.log('info', `Test Cron-Job is starting with rule: ${rule}`, {
      label: 'Server',
    });
    job = cron.scheduleJob(
      {
        // https://crontab.guru/
        rule: rule,
        tz: 'Europe/Vienna',
      },
      async function () {
        try {
          logger.log('info', 'Test Cron-Job', {
            label: 'CronJob',
          });
          Logging(await cleanupDatabase());
          Logging(await reminderDeletion());
          Logging(await reminderVIS());
          Logging(await reminderPremium());
        } catch (e) {
          logger.log('error', e, { label: 'CronJob' });
        }
      },
    );
  },
  nextRun: () =>
    logger.log('info', `Next CronJob at: ${job.nextInvocation()}`, {
      label: 'CronJob',
    }),
  stop: () => cron.gracefulShutdown(),
};

export { task };
