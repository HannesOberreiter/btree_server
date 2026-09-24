import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { RedisServer } from '../../src/servers/redis.server.js';

const server = new RedisServer();
const prefix = `btree_redis_compat:${randomUUID()}:`;
const sessionKey = `${prefix}session`;
const codeKey = `${prefix}code`;

beforeAll(async () => {
  await server.start();
  expect(RedisServer.client.isReady).toBe(true);
});

afterAll(async () => {
  try {
    if (RedisServer.client?.isReady) {
      await RedisServer.client.del([sessionKey, codeKey]);
    }
  } finally {
    await server.stop();
  }
});

describe('Redis 6 client integration', () => {
  it('negotiates RESP3 using the new defaults', async () => {
    expect((await RedisServer.client.clientInfo()).resp).toBe(3);
  });

  it('preserves expiring JSON values, session scans, and single-use OAuth reads', async () => {
    const client = RedisServer.client;
    const payload = JSON.stringify({ user: { bee_id: 7, user_id: 9 } });
    await client.setEx(sessionKey, 60, payload);
    await client.setEx(codeKey, 60, 'single-use-code');

    expect(await client.mGet([sessionKey, `${prefix}missing`])).toEqual([
      payload,
      null,
    ]);
    expect(await client.ttl(sessionKey)).toBeGreaterThan(0);
    expect(await client.ttl(sessionKey)).toBeLessThanOrEqual(60);
    const keys: string[] = [];
    for await (const batch of client.scanIterator({ MATCH: `${prefix}*` })) {
      keys.push(...batch);
    }
    expect(keys).toEqual(expect.arrayContaining([sessionKey, codeKey]));
    expect(await client.getDel(codeKey)).toBe('single-use-code');
    expect(await client.getDel(codeKey)).toBeNull();
  });

  it('uses the default five-second timeout for queued commands', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    try {
      expect(await RedisServer.client.ping()).toBe('PONG');
      expect(timeout).toHaveBeenCalledWith(5000);
    } finally {
      timeout.mockRestore();
    }
  });
});
