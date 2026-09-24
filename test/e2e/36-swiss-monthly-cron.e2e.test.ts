import cron from 'node-schedule';
import { afterEach, expect, it, vi } from 'vitest';

import * as pest from '../../src/api/adapters/pest.adapter.js';
import { Cron } from '../../src/services/cron.service.js';

afterEach(() => vi.restoreAllMocks());

it('schedules a full Swiss sync on the first of every month in Vienna time', async () => {
  const job = new cron.Job(() => undefined);
  const schedule = vi.spyOn(cron, 'scheduleJob').mockReturnValue(job);
  const sync = vi.spyOn(pest, 'fetchAsiatischeHornisseCh').mockResolvedValue({
    newObservations: 0,
    updatedObservations: 0,
  });
  await Cron.getInstance().start();
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
