import cron from 'node-schedule';
import { Container } from '@config/container.config';
import {
  cleanupDatabase,
  reminderPremium,
  reminderDeletion,
  reminderVIS,
} from '@/api/utils/cron.util';
import { cronjobTimer } from '@/config/environment.config';

let job: any;

function Logger(input: any) {
  Container.resolve('Logger').log('info', JSON.stringify(input), {
    label: 'CronJob',
  });
}

const task = {
  start: async () => {
    const rule = cronjobTimer;
    Container.resolve('Logger').log(
      'info',
      `Test Cron-Job is starting with rule: ${rule}`,
      { label: 'Server' },
    );
    job = cron.scheduleJob(
      {
        // https://crontab.guru/
        rule: rule,
        tz: 'Europe/Vienna',
      },
      async function () {
        try {
          Container.resolve('Logger').log('info', 'Test Cron-Job', {
            label: 'CronJob',
          });
          Logger(await cleanupDatabase());
          Logger(await reminderDeletion());
          Logger(await reminderVIS());
          Logger(await reminderPremium());
        } catch (e) {
          Container.resolve('Logger').log('error', e, { label: 'CronJob' });
        }
      },
    );
  },
  nextRun: () =>
    Container.resolve('Logger').log(
      'info',
      `Next CronJob at: ${job.nextInvocation()}`,
      {
        label: 'CronJob',
      },
    ),
  stop: () => cron.gracefulShutdown(),
};

export { task };
