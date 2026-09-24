import { Buffer } from 'node:buffer';

import { describe, expect, it } from 'vitest';

import { redisValueToString } from '../../src/api/utils/redis.util.js';

describe('Redis text and cursor normalization', () => {
  it.each(['', '0', 'btree_sess:7:uuid', '{"name":"Bienen"}'])(
    'preserves string %s',
    (value) => {
      expect(redisValueToString(value)).toBe(value);
    },
  );

  it('decodes Buffer values as UTF-8', () => {
    expect(redisValueToString(Buffer.from('{"name":"Bienenstöcke"}'))).toBe(
      '{"name":"Bienenstöcke"}',
    );
  });

  it.each([0, 42])('normalizes numeric scan cursor %s', (cursor) => {
    expect(redisValueToString(cursor)).toBe(String(cursor));
  });
});
