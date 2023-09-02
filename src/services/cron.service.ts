import cron from 'node-schedule';

import {
  cleanupDatabase,
  reminderPremium,
  reminderDeletion,
  reminderVIS,
} from '../api/utils/cron.util.js';
import { cronjobTimer } from '../config/environment.config.js';
import { Logger } from './logger.service.js';
import { fetchObservations } from '../api/utils/velutina.util.js';

export class Cron {
  private static instance: Cron;
  logger = Logger.getInstance();
  job: cron.Job;

  static getInstance(): Cron {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  private Logging(input: any) {
    this.logger.log('debug', JSON.stringify(input), {
      label: 'CronJob',
    });
  }

  async start() {
    this.logger.log(
      'debug',
      `Test Cron-Job is starting with rule: ${cronjobTimer}`,
      {
        label: 'Server',
      },
    );
    this.job = cron.scheduleJob(
      {
        // https://crontab.guru/
        rule: cronjobTimer,
        tz: 'Europe/Vienna',
      },
      async () => {
        try {
          this.logger.log('debug', 'Test Cron-Job', {
            label: 'CronJob',
          });
          this.Logging(await cleanupDatabase());
          this.Logging(await reminderDeletion());
          this.Logging(await reminderVIS());
          this.Logging(await reminderPremium());
          fetchObservations().then((res) => this.Logging(res));
        } catch (e) {
          this.logger.log('error', e, { label: 'CronJob' });
        }
      },
    );
    this.nextRun();
  }

  private nextRun() {
    this.logger.log('debug', `Next CronJob at: ${this.job.nextInvocation()}`, {
      label: 'CronJob',
    });
  }

  async gracefulShutdown(): Promise<void> {
    this.logger.log('debug', 'CronJob is shutting down', {
      label: 'CronJob',
    });
    await cron.gracefulShutdown();
    this.logger.log('debug', 'CronJob is shut down', {
      label: 'CronJob',
    });
    return;
  }
}
