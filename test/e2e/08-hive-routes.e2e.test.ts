import { beforeAll, describe, expect, it } from 'vitest';
import { createAgent, doRequest, doQueryRequest, expectations, type TestAgent } from '../../utils/index.js';

const testInsert = {
  name: 'Hive',
  apiary_id: 1,
  date: new Date().toISOString().slice(0, 10),
  source_id: 1,
  type_id: 1,
  start: 0,
  repeat: 10,
};

const patchName = `Hive${Date.now()}`;

describe('hive routes', () => {
  const route = '/api/v1/hive';
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
    expect(res2.body).toBeInstanceOf(Array);
    insertId = res2.body[0];
  });

  describe('/api/v1/hive/', () => {
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
      const res = await doRequest(createAgent(), 'patch', route, null, null, { ids: [insertId], data: {} });
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });

    it('get 200 - success', async () => {
      const res = await doQueryRequest(agent, route, null, accessToken, null);
      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toBeInstanceOf(Array);
      expect(res.body.total).toBeTypeOf('number');
    });

    it('post 400 - no data', async () => {
      const res = await doRequest(agent, 'post', route, null, accessToken, null);
      expect(res.statusCode).toEqual(400);
    });

    it('post 409 - duplicate name', async () => {
      const res = await doRequest(agent, 'post', route, null, accessToken, testInsert);
      expect(res.statusCode).toEqual(409);
    });

    it('patch 200 - success', async () => {
      const res = await doRequest(agent, 'patch', route, null, accessToken, { ids: [insertId], data: { name: patchName } });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(1);
    });

    it('patch 200 - success second patch with same name', async () => {
      const res = await doRequest(agent, 'patch', route, null, accessToken, { ids: [insertId], data: { name: patchName } });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(1);
    });
  });

  describe('/api/v1/hive/:id', () => {
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

  describe('/api/v1/hive/task/:id', () => {
    it('401 - no header', async () => {
      const res = await doQueryRequest(createAgent(), `${route}/task`, insertId, null, null);
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('200 - success', async () => {
      const res = await doQueryRequest(agent, `${route}/task`, insertId, accessToken, null);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('harvest');
      expect(res.body).toHaveProperty('feed');
      expect(res.body).toHaveProperty('treatment');
      expect(res.body).toHaveProperty('checkup');
      expect(res.body).toHaveProperty('movedate');
    });
  });

  describe('/api/v1/hive/batchGet', () => {
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

  describe('/api/v1/hive/updatePosition', () => {
    it('401 - no header', async () => {
      const res = await doRequest(createAgent(), 'patch', `${route}/updatePosition`, null, null, { data: [{ position: 0, id: insertId }] });
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('400 - missing ids', async () => {
      const res = await doRequest(agent, 'patch', `${route}/updatePosition`, null, null, null);
      expect(res.statusCode).toEqual(400);
      expectations(res, 'data', 'Invalid value');
    });
    it('200 - success', async () => {
      const res = await doRequest(agent, 'patch', `${route}/updatePosition`, null, accessToken, { data: [{ position: 0, id: insertId }] });
      expect(res.statusCode).toEqual(200);
      expect(res.body[0]).toBe(1);
    });
  });

  describe('/api/v1/hive/batchDelete', () => {
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

  describe('/api/v1/hive/status', () => {
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
