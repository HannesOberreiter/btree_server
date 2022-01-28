import cron from 'node-schedule';
import { Container } from '@config/container.config';

const task = {
  start: () => {
    const rule = '0 */12 * * *';
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
      function () {
        Container.resolve('Logger').log('info', `Test Cron-Job`, {
          label: 'CronJob'
        });
      }
    );
  },
  stop: () => cron.gracefulShutdown()
};

export { task };
