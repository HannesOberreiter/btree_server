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
