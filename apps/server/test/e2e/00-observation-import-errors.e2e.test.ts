import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchObservations } from '../../src/api/adapters/pest.adapter.js';
import * as observations from '../../src/api/modules/observation.module.js';

const mocks = vi.hoisted(() => ({
  insertExecute: vi.fn<() => Promise<unknown>>(),
}));

vi.mock('../../src/servers/kysely.server.js', () => ({
  KyselyServer: {
    getInstance: () => ({
      db: {
        insertInto: () => ({
          values: () => ({ execute: mocks.insertExecute }),
        }),
      },
    }),
  },
}));
vi.mock('../../src/servers/redis.server.js', () => {
  throw new Error('Observation imports must not depend on Redis');
});

beforeEach(() => {
  mocks.insertExecute.mockReset().mockResolvedValue({});
  vi.spyOn(observations, 'getRandomObservationSample').mockResolvedValue([]);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-14T12:00:00Z'));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('observation import failures without cache invalidation', () => {
  it('propagates a second-batch error after a partially committed historical batch', async () => {
    const records = Array.from({ length: 501 }, (_, index) => ({
      id: index + 1,
      time_observed_at: '2010-06-01T00:00:00Z',
      location: '47,8',
    }));
    vi.spyOn(observations, 'filterNewObservationExternalIds').mockResolvedValue(
      new Set(records.map((record) => record.id)),
    );
    mocks.insertExecute
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('second batch failed'));
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(JSON.stringify({ results: records }))),
    );

    await expect(fetchObservations('Vespa velutina')).rejects.toThrow(
      'second batch failed',
    );
    expect(mocks.insertExecute).toHaveBeenCalledTimes(2);
  });

  it('propagates a provider failure without Redis work', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockRejectedValue(new Error('provider failed')),
    );
    await expect(fetchObservations('Vespa velutina')).rejects.toThrow(
      'provider failed',
    );
    expect(mocks.insertExecute).not.toHaveBeenCalled();
  });

  it('returns the Aethina import result without Redis work', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(async (input) => {
        const url = new URL(
          input instanceof Request ? input.url : String(input),
        );
        if (
          ![
            'api.inaturalist.org',
            'observation.org',
            'www.artenfinder.net',
            'api.gbif.org',
          ].includes(url.hostname)
        ) {
          throw new Error(`Unexpected feed: ${url.hostname}`);
        }
        return new Response(
          JSON.stringify({ results: [], result: [], next: null }),
        );
      }),
    );

    expect(await fetchObservations('Aethina tumida')).toMatchObject({
      taxa: 'Aethina tumida',
      infoFaunaCh: { newObservations: 0 },
    });
  });
});
