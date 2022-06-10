import cron from 'node-schedule';
import { Container } from '@config/container.config';
import { cleanupDatabase, visReminder } from '@/api/utils/cron.util';

const task = {
  start: () => {
    const rule = '*/1 * * * *';
    Container.resolve('Logger').log(
      'info',
      `Test Cron-Job is starting with rule: ${rule}`,
      { label: 'Server' }
    );
    cron.scheduleJob(
      {
        // https://crontab.guru/
        rule: rule,
        tz: 'Europe/Vienna'
      },
      async function () {
        try {
          Container.resolve('Logger').log('info', 'Test Cron-Job', {
            label: 'CronJob'
          });
          const cleanup = await cleanupDatabase()
          Container.resolve('Logger').log('info', JSON.stringify(cleanup), {
            label: 'CronJob'
          });
          const vis_reminder = await visReminder()
          Container.resolve('Logger').log('info', JSON.stringify(vis_reminder), {
            label: 'CronJob'
          });
        } catch (e) {
          Container.resolve('Logger').log('error', e, {label: 'CronJob'});
        }
      }
    );
  },
  stop: () => cron.gracefulShutdown()
};

export { task };
