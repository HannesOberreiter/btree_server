/**
 * Requests use Fastify.inject with a mocked controller and in-memory sessions;
 * no HTTP requests go to the beta API. Uses the existing E2E test setup.
 */
import fastifyCookie from '@fastify/cookie';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySession from '@fastify/session';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import publicRoutes from '../../src/api/routes/v1/public.route.js';

declare module 'fastify' {
  interface Session {
    publicMapCacheTestUser?: string;
  }
}

const fixture = vi.hoisted(() => ({ mode: 'normal' }));
vi.mock('../../src/api/controllers/public.controller.js', () => {
  function handler(request: FastifyRequest, reply: FastifyReply) {
    if (fixture.mode === 'error')
      return reply.code(503).send({ error: 'test' });
    if (fixture.mode === 'html')
      return reply.type('text/html').send('<html>test</html>');
    if (fixture.mode === 'cookie') reply.setCookie('test-cookie', 'test-value');
    if (fixture.mode === 'session')
      request.session.set('publicMapCacheTestUser', 'new-session');
    return request.routeOptions.url?.endsWith('/stats') ? { count: 1 } : [];
  }
  return {
    default: {
      getPestObservationsRecent: handler,
      getPestObservationsYear: handler,
      getPestObservationsStats: handler,
    },
  };
});

let server: FastifyInstance;
const stats = '/api/v1/public/velutina/observations/stats';
const marker = 'x-btree-public-cache';

beforeEach(async () => {
  fixture.mode = 'normal';
  server = Fastify();
  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);
  server.addHook('onRequest', (_request, reply, done) => {
    reply.header('Vary', 'Origin, Referer');
    done();
  });
  await server.register(fastifyCookie);
  await server.register(fastifySession, {
    secret: 'isolated-test-session-secret-at-least-32-characters',
    cookie: { secure: false },
    saveUninitialized: false,
    rolling: false,
  });
  await server.register(fastifyRateLimit, { max: 1000, timeWindow: 60000 });
  await server.register(publicRoutes, { prefix: '/api/v1/public' });
  server.post<{ Params: { user: string } }>('/test/login/:user', (request) => {
    request.session.set('publicMapCacheTestUser', request.params.user);
    return { ok: true };
  });
  server.get('/test/private', (request, reply) => {
    const user = request.session.get('publicMapCacheTestUser');
    if (!user) return reply.code(401).send({ error: 'Unauthorized' });
    return { user };
  });
  await server.ready();
});
afterEach(async () => server.close());

function expectBypass(response: { headers: Record<string, unknown> }) {
  expect(response.headers[marker]).toBe('bypass');
  expect(response.headers['cache-control']).toBe('private, no-store');
}

describe('public map cache response boundary', () => {
  it.each(
    ['velutina', 'aethina_tumida'].flatMap((taxa) =>
      ['recent', 'stats', 'year/2025'].map(
        (suffix) => `/api/v1/public/${taxa}/observations/${suffix}`,
      ),
    ),
  )('attests successful anonymous JSON on %s', async (url) => {
    const response = await server.inject({ url });
    expect(response.statusCode).toBe(200);
    expect(response.headers[marker]).toBe('eligible');
    expect(response.headers['cache-control']).toBe('public, max-age=0');
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.headers['x-ratelimit-limit']).toBeUndefined();
    expect(response.headers['x-ratelimit-remaining']).toBeUndefined();
    expect(response.headers['x-ratelimit-reset']).toBeUndefined();
    expect(String(response.headers.vary).toLowerCase()).toBe(
      'origin, referer, cookie, authorization',
    );
  });

  it.each([
    { cookie: 'session=test-one' },
    { cookie: '' },
    { authorization: 'Bearer test-one' },
    { authorization: '' },
    { cookie: 'session=test-two', authorization: 'Bearer test-two' },
  ])('does not attest credential-bearing requests: %j', async (headers) => {
    const response = await server.inject({ url: stats, headers });
    expect(response.statusCode).toBe(200);
    expectBypass(response);
  });

  it.each(['?unexpected=1', '?external'])(
    'bypasses query string %s',
    async (query) => {
      const response = await server.inject({ url: stats + query });
      expect(response.statusCode).toBe(200);
      expectBypass(response);
    },
  );

  it.each(['cookie', 'session'])(
    'checks cookies after %s processing',
    async (mode) => {
      fixture.mode = mode;
      const response = await server.inject({ url: stats });
      expect(response.statusCode).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
      expectBypass(response);
    },
  );

  it('does not allow a request to forge the response eligibility marker', async () => {
    fixture.mode = 'error';
    const response = await server.inject({
      url: stats,
      headers: { [marker]: 'eligible' },
    });
    expect(response.statusCode).toBe(503);
    expectBypass(response);
  });

  it('does not attest HTML', async () => {
    fixture.mode = 'html';
    const response = await server.inject({ url: stats });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expectBypass(response);
  });

  it('does not attest HEAD responses', async () => {
    const response = await server.inject({ method: 'HEAD', url: stats });
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('');
    expectBypass(response);
  });

  it.each([
    '/api/v1/public/unknown/observations/stats',
    '/api/v1/public/velutina/observations/year/not-a-year',
    '/api/v1/public/velutina/observations/stats/extra',
  ])('never attests invalid or unregistered path %s', async (url) => {
    const response = await server.inject({ url });
    expect(response.statusCode).toBeGreaterThanOrEqual(400);
    expect(response.headers[marker]).not.toBe('eligible');
  });

  it('keeps two real local sessions distinct and excludes their public responses', async () => {
    const cookies: string[] = [];
    for (const user of ['alice', 'bob']) {
      const login = await server.inject({
        method: 'POST',
        url: `/test/login/${user}`,
      });
      expect(login.statusCode).toBe(200);
      const header = login.headers['set-cookie'];
      expect(typeof header).toBe('string');
      const cookie = String(header).split(';', 1)[0];
      cookies.push(cookie);
      const privateResponse = await server.inject({
        url: '/test/private',
        headers: { cookie },
      });
      expect(privateResponse.json()).toEqual({ user });
      expect(privateResponse.headers[marker]).toBeUndefined();
      expect(privateResponse.headers['x-ratelimit-limit']).toBe('1000');
      expect(privateResponse.headers['x-ratelimit-remaining']).toBeDefined();
      const publicResponse = await server.inject({
        url: stats,
        headers: { cookie },
      });
      expect(publicResponse.json()).toEqual({ count: 1 });
      expectBypass(publicResponse);
    }
    expect(cookies[0]).not.toBe(cookies[1]);
    const anonymous = await server.inject({ url: stats });
    expect(anonymous.headers[marker]).toBe('eligible');
    expect(anonymous.headers['set-cookie']).toBeUndefined();
    expect((await server.inject({ url: '/test/private' })).statusCode).toBe(
      401,
    );
  });
});
