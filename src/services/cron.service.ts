import cron from 'node-schedule';

import { fetchObservations } from '../api/adapters/pest.adapter.js';
import {
  cleanupDatabase,
  reminderDeletion,
  reminderPremium,
  reminderVIS,
} from '../api/modules/maintenance.module.js';
import { cronjobTimer, isChild } from '../config/environment.config.js';
import { KyselyServer } from '../servers/kysely.server.js';
import { Logger } from './logger.service.js';

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

  private Logging(input: unknown) {
    this.logger.log('debug', JSON.stringify(input), {
      label: 'CronJob',
    });
  }

  async start() {
    if (isChild) {
      this.logger.log('debug', 'CronJob is not running in child mode', {
        label: 'CronJob',
      });
      return;
    }

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
          await this.run();
        } catch (error) {
          this.logger.log(
            'error',
            error instanceof Error ? error.message : String(error),
            {
              label: 'CronJob',
            },
          );
        }
      },
    );
    this.nextRun();
  }

  async run() {
    this.logger.log('info', 'CronJob is running', {
      label: 'CronJob',
    });
    const db = KyselyServer.getInstance().db;
    this.Logging(await cleanupDatabase(db));

    reminderDeletion(db)
      .then((res) => this.Logging(res))
      .catch((error) =>
        this.logger.log(
          'error',
          error instanceof Error ? error.message : String(error),
          {
            label: 'CronJob',
          },
        ),
      );

    reminderVIS(db)
      .then((res) => this.Logging(res))
      .catch((error) =>
        this.logger.log(
          'error',
          error instanceof Error ? error.message : String(error),
          {
            label: 'CronJob',
          },
        ),
      );

    await reminderPremium(db)
      .then((res) => this.Logging(res))
      .catch((error) =>
        this.logger.log(
          'error',
          error instanceof Error ? error.message : String(error),
          {
            label: 'CronJob',
          },
        ),
      );

    fetchObservations('Vespa velutina')
      .then((res) => this.Logging(res))
      .catch((error) =>
        this.logger.log(
          'error',
          error instanceof Error ? error.message : String(error),
          {
            label: 'CronJob',
          },
        ),
      )
      .finally(() =>
        fetchObservations('Aethina tumida')
          .then((res) => this.Logging(res))
          .catch((error) =>
            this.logger.log(
              'error',
              error instanceof Error ? error.message : String(error),
              { label: 'CronJob' },
            ),
          ),
      );
  }

  private nextRun() {
    this.logger.log(
      'debug',
      `Next CronJob at: ${String(this.job.nextInvocation())}`,
      {
        label: 'CronJob',
      },
    );
  }

  async gracefulShutdown(): Promise<void> {
    if (isChild) {
      this.logger.log('debug', 'CronJob is not running in child mode', {
        label: 'CronJob',
      });
      return;
    }

    this.logger.log('debug', 'CronJob is shutting down', {
      label: 'CronJob',
    });
    await cron.gracefulShutdown();
    this.logger.log('debug', 'CronJob is shut down', {
      label: 'CronJob',
    });
  }
}
