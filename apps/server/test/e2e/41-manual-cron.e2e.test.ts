import { beforeEach, expect, it, vi } from 'vitest';

import { runManualCron } from '../../src/services/manual-cron.service.js';

const mocks = vi.hoisted(() => ({
  env: 'staging',
  ready: true,
  redisStart: vi.fn<() => Promise<void>>(),
  redisStop: vi.fn<() => Promise<void>>(),
  databaseStop: vi.fn<() => Promise<void>>(),
  mailSetup: vi.fn<() => Promise<void>>(),
  run: vi.fn<() => Promise<void>>(),
  schedule: vi.fn(),
  log: vi.fn(),
  close: vi.fn(),
}));

vi.mock('../../src/config/environment.config.js', () => ({
  get env() {
    return mocks.env;
  },
}));
vi.mock('../../src/servers/redis.server.js', () => ({
  RedisServer: class {
    static get client() {
      return { isReady: mocks.ready };
    }
    start = mocks.redisStart;
    stop = mocks.redisStop;
  },
}));
vi.mock('../../src/servers/kysely.server.js', () => ({
  KyselyServer: { getInstance: () => ({ stop: mocks.databaseStop }) },
}));
vi.mock('../../src/services/mail.service.js', () => ({
  MailService: { getInstance: () => ({ setup: mocks.mailSetup }) },
}));
vi.mock('../../src/services/cron.service.js', () => ({
  Cron: { getInstance: () => ({ run: mocks.run, start: mocks.schedule }) },
}));
vi.mock('../../src/services/logger.service.js', () => ({
  Logger: { getInstance: () => ({ log: mocks.log, close: mocks.close }) },
}));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.env = 'staging';
  mocks.ready = true;
  mocks.redisStart.mockResolvedValue();
  mocks.redisStop.mockResolvedValue();
  mocks.databaseStop.mockResolvedValue();
  mocks.mailSetup.mockResolvedValue();
  mocks.run.mockResolvedValue();
});

it.each(['production', 'test', 'ci', 'unknown'])(
  'rejects %s before starting services or running any cron work',
  async (env) => {
    mocks.env = env;
    await expect(runManualCron()).rejects.toThrow(
      'Manual cron runs are only allowed in staging or development',
    );
    expect(mocks.redisStart).not.toHaveBeenCalled();
    expect(mocks.mailSetup).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
    expect(mocks.schedule).not.toHaveBeenCalled();
  },
);

it.each(['staging', 'development'])(
  'runs once in %s and waits for completion before closing connections',
  async (env) => {
    mocks.env = env;
    let finish!: () => void;
    mocks.run.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const run = runManualCron();
    await vi.waitFor(() => expect(mocks.run).toHaveBeenCalledOnce());
    expect(mocks.redisStart).toHaveBeenCalledOnce();
    expect(mocks.mailSetup).toHaveBeenCalledOnce();
    expect(mocks.redisStop).not.toHaveBeenCalled();
    expect(mocks.databaseStop).not.toHaveBeenCalled();
    finish();
    await run;
    expect(mocks.redisStop).toHaveBeenCalledOnce();
    expect(mocks.databaseStop).toHaveBeenCalledOnce();
    expect(mocks.close).toHaveBeenCalledOnce();
    expect(mocks.schedule).not.toHaveBeenCalled();
  },
);

it('cleans up and propagates a failed run', async () => {
  mocks.run.mockRejectedValue(new Error('cleanup failed'));
  await expect(runManualCron()).rejects.toThrow('cleanup failed');
  expect(mocks.redisStop).toHaveBeenCalledOnce();
  expect(mocks.databaseStop).toHaveBeenCalledOnce();
  expect(mocks.close).toHaveBeenCalledOnce();
});

it('does not run when Redis failed to connect', async () => {
  mocks.ready = false;
  await expect(runManualCron()).rejects.toThrow('Redis is not ready');
  expect(mocks.run).not.toHaveBeenCalled();
  expect(mocks.redisStop).toHaveBeenCalledOnce();
  expect(mocks.databaseStop).toHaveBeenCalledOnce();
});

it('cleans up after mail setup fails', async () => {
  mocks.mailSetup.mockRejectedValue(new Error('mail setup failed'));
  await expect(runManualCron()).rejects.toThrow('mail setup failed');
  expect(mocks.run).not.toHaveBeenCalled();
  expect(mocks.redisStop).toHaveBeenCalledOnce();
  expect(mocks.databaseStop).toHaveBeenCalledOnce();
});
