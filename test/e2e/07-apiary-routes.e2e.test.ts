import type { TestAgent } from '../../utils/index.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { createAgent, doQueryRequest, doRequest, expectations } from '../../utils/index.js';

const testInsert = {
  name: `TestApiary${new Date().toISOString()}`,
};

describe('apiary routes', () => {
  const route = '/api/v1/apiary';
  let agent: TestAgent;
  let accessToken: any;
  let insertId: any;

  beforeAll(async () => {
    agent = createAgent();
    const res = await doRequest(agent, 'post', '/api/v1/auth/login', null, null, globalThis.demoUser);
    expect(res.statusCode).toEqual(200);
    expect(res.header, 'set-cookie', /connect.sid=.*; Path=\/; HttpOnly/);
    const res2 = await doRequest(agent, 'post', route, null, accessToken, testInsert);
    expect(res2.statusCode).toEqual(200);
    expect(res2.body).toHaveProperty('id');
    insertId = res2.body.id;
  });

  describe('/api/v1/apiary/', () => {
    it('get 401 - no header', async () => {
      const res = await doQueryRequest(createAgent(), route, null, null, null);
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('post 401 - no header', async () => {
      const res = await doRequest(createAgent(), 'post', route, null, null, testInsert);
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('patch 401 - no header', async () => {
      const res = await doRequest(createAgent(), 'patch', route, null, null, null);
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });

    it('get 200 - success', async () => {
      const res = await doQueryRequest(agent, route, null, accessToken, null);
      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toBeInstanceOf(Array);
      expect(res.body.total).toBeTypeOf('number');
    });

    it('post 400 - no name', async () => {
      const res = await doRequest(agent, 'post', route, null, accessToken, null);
      expect(res.statusCode).toEqual(400);
      expectations(res, 'name', 'Invalid value');
    });

    it('post 409 - duplicate name', async () => {
      const res = await doRequest(agent, 'post', route, null, accessToken, testInsert);
      expect(res.statusCode).toEqual(409);
    });

    it('patch 200 - success', async () => {
      const res = await doRequest(agent, 'patch', route, null, accessToken, { ids: [insertId], data: { name: 'test2' } });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(1);
    });
  });

  describe('/api/v1/apiary/:id', () => {
    it('401 - no header', async () => {
      const res = await doQueryRequest(createAgent(), route, insertId, null, null);
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('200 - success', async () => {
      const res = await doQueryRequest(agent, route, insertId, accessToken, null);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('sameLocation');
    });
  });

  describe('/api/v1/apiary/batchGet', () => {
    it('401 - no header', async () => {
      const res = await doRequest(createAgent(), 'post', `${route}/batchGet`, null, null, { ids: [insertId] });
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('400 - missing ids', async () => {
      const res = await doRequest(agent, 'post', `${route}/batchGet`, null, null, null);
      expect(res.statusCode).toEqual(400);
      expectations(res, 'ids', 'Invalid value');
    });
    it('200 - success', async () => {
      const res = await doRequest(agent, 'post', `${route}/batchGet`, null, accessToken, { ids: [insertId] });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
    });
  });

  describe('/api/v1/apiary/batchDelete', () => {
    it('401 - no header', async () => {
      const res = await doRequest(createAgent(), 'patch', `${route}/batchDelete`, null, null, { ids: [] });
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('400 - missing ids', async () => {
      const res = await doRequest(agent, 'patch', `${route}/batchDelete`, null, null, null);
      expect(res.statusCode).toEqual(400);
      expectations(res, 'ids', 'Invalid value');
    });
    it('200 - success', async () => {
      const res = await doRequest(agent, 'patch', `${route}/batchDelete`, null, accessToken, { ids: [insertId] });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
    });
  });

  describe('/api/v1/apiary/status', () => {
    it('401 - no header', async () => {
      const res = await doRequest(createAgent(), 'patch', `${route}/status`, null, null, { ids: [], status: true });
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('400 - missing ids', async () => {
      const res = await doRequest(agent, 'patch', `${route}/status`, null, null, null);
      expect(res.statusCode).toEqual(400);
      expectations(res, 'ids', 'Invalid value');
    });
    it('200 - success', async () => {
      const res = await doRequest(agent, 'patch', `${route}/status`, null, accessToken, { ids: [insertId], status: false });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(1);
    });
  });
});
