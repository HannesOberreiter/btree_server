import cron from 'node-cron';
import { Container } from '@config/container.config';

const task = cron.schedule(
  // https://crontab.guru/
  '*/10 * * * *',
  () => {
    Container.resolve('Logger').log('info', `Test Cron-Job`, {
      label: 'CronJob'
    });
  },
  {
    scheduled: true,
    timezone: 'Europe/Vienna'
  }
);

export { task };
