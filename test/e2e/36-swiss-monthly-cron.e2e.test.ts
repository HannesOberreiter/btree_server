import cron from 'node-schedule';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import * as pest from '../../src/api/adapters/pest.adapter.js';
import { Cron } from '../../src/services/cron.service.js';

const config = vi.hoisted(() => ({
  cronjobTimer: '0 11 */1 * *',
  isChild: false,
}));

const tasks = vi.hoisted(() => ({
  cleanup: vi.fn<() => Promise<unknown>>(),
  deletion: vi.fn<() => Promise<unknown>>(),
  vis: vi.fn<() => Promise<unknown>>(),
  premium: vi.fn<() => Promise<unknown>>(),
  observations: vi.fn<(taxa: string) => Promise<unknown>>(),
}));

vi.mock('../../src/config/environment.config.js', () => config);
vi.mock('../../src/api/adapters/pest.adapter.js', () => ({
  fetchAsiatischeHornisseCh: vi.fn(),
  fetchObservations: tasks.observations,
}));
vi.mock('../../src/api/modules/maintenance.module.js', () => ({
  cleanupDatabase: tasks.cleanup,
  reminderDeletion: tasks.deletion,
  reminderPremium: tasks.premium,
  reminderVIS: tasks.vis,
}));
vi.mock('../../src/servers/kysely.server.js', () => ({
  KyselyServer: { getInstance: () => ({ db: {} }) },
}));
vi.mock('../../src/services/logger.service.js', () => ({
  Logger: { getInstance: () => ({ log: vi.fn() }) },
}));

beforeEach(() => {
  for (const task of Object.values(tasks)) {
    task.mockReset().mockResolvedValue({});
  }
  config.cronjobTimer = '0 11 */1 * *';
  config.isChild = false;
});

afterEach(() => vi.restoreAllMocks());

it('disables both schedules when CRONJOB is off and shuts down safely', async () => {
  config.cronjobTimer = 'off';
  const job = new cron.Job(() => undefined);
  const schedule = vi.spyOn(cron, 'scheduleJob').mockReturnValue(job);
  vi.spyOn(cron, 'gracefulShutdown').mockResolvedValue();

  await Cron.getInstance().start();
  expect(schedule).not.toHaveBeenCalled();
  await expect(Cron.getInstance().gracefulShutdown()).resolves.toBeUndefined();
});

it('keeps both schedules disabled in child mode', async () => {
  config.isChild = true;
  const schedule = vi.spyOn(cron, 'scheduleJob');

  await Cron.getInstance().start();
  expect(schedule).not.toHaveBeenCalled();
});

it.each(['deletion', 'vis', 'observations'] as const)(
  'waits for %s work before completing a run with schedules disabled',
  async (task) => {
    config.cronjobTimer = 'off';
    let finish!: () => void;
    tasks[task].mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    let completed = false;
    const run = Cron.getInstance()
      .run()
      .then(() => {
        completed = true;
        return undefined;
      });

    await vi.waitFor(() => expect(tasks.observations).toHaveBeenCalled());
    expect(completed).toBe(false);
    finish();
    await run;
    expect(completed).toBe(true);
    expect(tasks.cleanup).toHaveBeenCalledOnce();
    expect(tasks.deletion).toHaveBeenCalledOnce();
    expect(tasks.vis).toHaveBeenCalledOnce();
    expect(tasks.premium).toHaveBeenCalledOnce();
    expect(tasks.observations.mock.calls).toEqual([
      ['Vespa velutina'],
      ['Aethina tumida'],
    ]);
  },
);

it('still imports Aethina tumida after a failed Vespa velutina import', async () => {
  tasks.observations.mockRejectedValueOnce(new Error('provider failed'));
  await Cron.getInstance().run();
  expect(tasks.observations.mock.calls).toEqual([
    ['Vespa velutina'],
    ['Aethina tumida'],
  ]);
});

it('schedules a full Swiss sync on the first of every month in Vienna time', async () => {
  const job = new cron.Job(() => undefined);
  const schedule = vi.spyOn(cron, 'scheduleJob').mockReturnValue(job);
  const sync = vi.spyOn(pest, 'fetchAsiatischeHornisseCh').mockResolvedValue({
    newObservations: 0,
    updatedObservations: 0,
  });
  await Cron.getInstance().start();
  expect(schedule).toHaveBeenCalledTimes(2);
  expect(schedule).toHaveBeenNthCalledWith(
    1,
    { rule: config.cronjobTimer, tz: 'Europe/Vienna' },
    expect.any(Function),
  );
  expect(schedule).toHaveBeenCalledWith(
    { rule: '0 10 1 * *', tz: 'Europe/Vienna' },
    expect.any(Function),
  );
  const callback = schedule.mock.calls[1]?.[1];
  if (typeof callback !== 'function')
    throw new Error('Missing monthly callback');
  await callback(new Date());
  expect(sync).toHaveBeenCalledWith(true);

  const shutdown = vi.spyOn(cron, 'gracefulShutdown').mockResolvedValue();
  await Cron.getInstance().gracefulShutdown();
  expect(shutdown).toHaveBeenCalledOnce();
});
