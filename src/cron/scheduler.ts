import cron from 'node-schedule';
import {
  cleanupDatabase,
  reminderPremium,
  reminderDeletion,
  reminderVIS,
} from '../api/utils/cron.util.js';
import { cronjobTimer } from '../config/environment.config.js';
import { Logger } from '../services/logger.service.js';

let job: any;

const logger = Logger.getInstance();

function Logging(input: any) {
  logger.log('debug', JSON.stringify(input), {
    label: 'CronJob',
  });
}

const task = {
  start: async () => {
    const rule = cronjobTimer;
    logger.log('debug', `Test Cron-Job is starting with rule: ${rule}`, {
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
          logger.log('debug', 'Test Cron-Job', {
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
    logger.log('debug', `Next CronJob at: ${job.nextInvocation()}`, {
      label: 'CronJob',
    }),
  stop: () => cron.gracefulShutdown(),
};

export { task };
