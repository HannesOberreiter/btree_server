import { describe, expect, it } from 'vitest';

import type { TestAgent } from '../utils.js';
import { createAgent, doRequest } from '../utils.js';

describe('routes resolving', () => {
  const agent: TestAgent = createAgent();

  describe('/status', () => {
    it('200 - OK', async () => {
      const res = await doRequest(
        agent,
        'get',
        '/api/v1/status',
        null,
        null,
        null,
      );
      expect(res.statusCode).toEqual(200);
    });
  });

  describe('/openapi.json', () => {
    it('200 - core specification stays separate from agent specifications', async () => {
      const res = await doRequest(
        agent,
        'get',
        '/api/v1/openapi.json',
        null,
        null,
        null,
      );

      expect(res.statusCode).toEqual(200);
      expect(res.body.openapi).toEqual('3.1.0');
      const paths = Object.keys(res.body.paths);
      expect(paths.some((path) => path.endsWith('/v1/status'))).toBe(true);
      expect(paths.some((path) => path.includes('/v1/agent/'))).toBe(false);
      expect(paths.some((path) => path.includes('/v1/chatgpt/'))).toBe(false);
    });
  });

  describe('/public/:taxa/observations', () => {
    it('200 - returns recent observation shape', async () => {
      const res = await doRequest(
        agent,
        'get',
        '/api/v1/public/velutina/observations/recent',
        null,
        null,
        null,
      );
      expect(res.statusCode).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.headers['cache-control']).toBe('public, max-age=3600');
      if (res.body.length > 0) {
        expect(res.body[0]).toEqual(
          expect.objectContaining({
            location: expect.objectContaining({
              x: expect.any(Number),
              y: expect.any(Number),
            }),
            uri: expect.any(String),
            observed_at: expect.any(String),
          }),
        );
      }
    });

    it('200 - returns yearly observations and stats', async () => {
      const year = new Date().getFullYear();
      const yearly = await doRequest(
        agent,
        'get',
        `/api/v1/public/aethina_tumida/observations/year/${year}`,
        null,
        null,
        null,
      );
      const stats = await doRequest(
        agent,
        'get',
        '/api/v1/public/aethina_tumida/observations/stats',
        null,
        null,
        null,
      );
      expect(yearly.statusCode).toBe(200);
      expect(yearly.body).toBeInstanceOf(Array);
      expect(stats.statusCode).toBe(200);
      expect(stats.body.count).toBeTypeOf('number');
    });

    it('400 - rejects unknown taxa', async () => {
      const res = await doRequest(
        agent,
        'get',
        '/api/v1/public/unknown/observations/stats',
        null,
        null,
        null,
      );
      expect(res.statusCode).toBe(400);
    });
  });

  describe('/report-violation', () => {
    it('200 - OK', async () => {
      const res = await doRequest(
        agent,
        'post',
        '/api/v1/report-violation',
        null,
        null,
        { data: 'report-violation' },
      );
      expect(res.statusCode).toEqual(200);
    });
  });

  describe('/*', () => {
    it('404 - anything', async () => {
      const res = await doRequest(
        agent,
        'get',
        '/api/v1/foo/bar',
        null,
        null,
        null,
      );
      expect(res.statusCode).toEqual(404);
    });

    it('406 - domain not allowed by CORS', async () => {
      const response = await fetch(
        `http://localhost:${process.env.PORT}/api/v1/status`,
        {
          headers: {
            Accept: process.env.CONTENT_TYPE!,
            'Content-Type': process.env.CONTENT_TYPE!,
            Origin: 'http://www.test.com',
          },
        },
      );
      expect(response.status).toEqual(406);
    });

    it('200 - options request', async () => {
      const res = await agent.request('options', '/api/v1/status');
      expect(res.headers['access-control-allow-origin']).toBe(
        process.env.ORIGIN,
      );
    });
  });
});
