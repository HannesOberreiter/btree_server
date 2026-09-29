/**
 * Requests use Fastify.inject in-process. Beta hostnames below are synthetic
 * Origin/Host/Referer header values, not HTTP destinations; beta is never called.
 * These tests run under the existing E2E setup.
 */
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Application } from '../../src/config/app.config.js';
import { Logger } from '../../src/services/logger.service.js';

const fixtures = vi.hoisted(() => ({ handlerCalls: 0 }));

// Exercise the application's actual CORS/session hooks without environment files,
// databases, Redis connections, or application data.
vi.mock('../../src/config/environment.config.js', () => ({
  env: 'staging',
  authorized: 'https://beta.btree.at,https://www.btree.at,api-beta.btree.at',
  sessionSecret: 'isolated-test-session-secret-at-least-32-characters',
}));
vi.mock('../../src/servers/redis.server.js', () => ({
  RedisServer: {
    client: {
      get: vi.fn(async () => null),
      set: vi.fn(async () => undefined),
      expire: vi.fn(async () => 1),
      del: vi.fn(async () => 1),
    },
  },
}));
vi.mock('../../src/api/routes/index.js', () => ({
  default(server: FastifyInstance, _options: unknown, done: () => void) {
    server.get('/v1/public/velutina/observations/stats', () => {
      fixtures.handlerCalls++;
      return { count: 1 };
    });
    server.get('/v1/public/velutina/observations/recent', () => [
      { description: 'Public observation '.repeat(200) },
    ]);
    server.get('/v1/external/example', () => ({ count: 1 }));
    done();
  },
}));
vi.mock('../../src/api/routes/mcp.route.js', () => ({
  default(_server: FastifyInstance, _options: unknown, done: () => void) {
    done();
  },
}));

const url = '/api/v1/public/velutina/observations/stats';
const host = 'api-beta.btree.at';
let server: FastifyInstance;

beforeEach(async () => {
  fixtures.handlerCalls = 0;
  Logger.getInstance().pino.level = 'silent';
  server = new Application().app;
  await server.ready();
});
afterEach(async () => {
  await server.close();
});

function varyTokens(value: string | string[] | undefined): string[] {
  return String(value ?? '')
    .toLowerCase()
    .split(',')
    .map((token) => token.trim());
}

describe('cache-safe application CORS', () => {
  it.each(['https://beta.btree.at', 'https://www.btree.at'])(
    'reflects only allowed Origin %s and varies its response',
    async (origin) => {
      const response = await server.inject({ url, headers: { host, origin } });
      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(origin);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(varyTokens(response.headers.vary)).toEqual(
        expect.arrayContaining(['origin', 'referer']),
      );
      expect(response.headers['set-cookie']).toBeUndefined();
    },
  );

  it('rejects a disallowed Origin without granting CORS or running the handler', async () => {
    const response = await server.inject({
      url,
      headers: { host, origin: 'https://example.invalid' },
    });
    expect(response.statusCode).toBe(406);
    expect(response.body).toBe('');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(
      response.headers['access-control-allow-credentials'],
    ).toBeUndefined();
    expect(varyTokens(response.headers.vary)).toContain('origin');
    expect(fixtures.handlerCalls).toBe(0);
  });

  it.each([
    { host },
    { host, referer: 'https://beta.btree.at/map/vespa_velutina' },
  ])(
    'does not manufacture an ACAO origin for a request without Origin',
    async (headers) => {
      const response = await server.inject({ url, headers });
      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(
        response.headers['access-control-allow-credentials'],
      ).toBeUndefined();
      expect(varyTokens(response.headers.vary)).toEqual(
        expect.arrayContaining(['origin', 'referer']),
      );
    },
  );

  it('preserves Referer-based rejection and varies that decision', async () => {
    const response = await server.inject({
      url,
      headers: { host, referer: 'https://example.invalid/map' },
    });
    expect(response.statusCode).toBe(406);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(varyTokens(response.headers.vary)).toContain('referer');
    expect(fixtures.handlerCalls).toBe(0);
  });

  it('handles allowed preflight without calling the dataset handler', async () => {
    const response = await server.inject({
      method: 'OPTIONS',
      url,
      headers: {
        host,
        origin: 'https://beta.btree.at',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'content-type',
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(
      'https://beta.btree.at',
    );
    expect(response.headers['access-control-allow-methods']).toContain('GET');
    expect(fixtures.handlerCalls).toBe(0);
  });

  it('rejects disallowed preflight without CORS permission', async () => {
    const response = await server.inject({
      method: 'OPTIONS',
      url,
      headers: { host, origin: 'https://example.invalid' },
    });
    expect(response.statusCode).toBe(406);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(fixtures.handlerCalls).toBe(0);
  });

  it('preserves Origin and Referer variation alongside compression', async () => {
    const response = await server.inject({
      url: '/api/v1/public/velutina/observations/recent',
      headers: {
        host,
        origin: 'https://beta.btree.at',
        'accept-encoding': 'gzip',
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-encoding']).toBe('gzip');
    expect(varyTokens(response.headers.vary)).toEqual(
      expect.arrayContaining(['origin', 'referer', 'accept-encoding']),
    );
  });

  it('preserves wildcard CORS on external routes', async () => {
    const response = await server.inject({
      url: '/api/v1/external/example',
      headers: { host, origin: 'https://example.invalid' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(
      response.headers['access-control-allow-credentials'],
    ).toBeUndefined();
  });
});
