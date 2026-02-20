import { beforeAll, describe, expect, it } from 'vitest';
import { createAgent, doRequest, doQueryRequest, expectations, type TestAgent } from '../../utils/index.js';

const testInsert = {
  date: new Date().toISOString().slice(0, 10),
  name: 'testTodo',
  note: '----',
  done: false,
  url: '',
  repeat: 10,
};

describe('todo routes', () => {
  const route = '/api/v1/todo';
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

  describe('/api/v1/todo/', () => {
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

    it('patch 200 - success', async () => {
      const res = await doRequest(agent, 'patch', route, null, accessToken, { ids: [insertId], data: {} });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(1);
    });
  });

  describe('/api/v1/todo/batchGet', () => {
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

  describe('/api/v1/todo/status', () => {
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

  describe('/api/v1/todo/date', () => {
    it('401 - no header', async () => {
      const res = await doRequest(createAgent(), 'patch', `${route}/date`, null, null, { ids: [], start: testInsert.date });
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('400 - missing ids', async () => {
      const res = await doRequest(agent, 'patch', `${route}/date`, null, null, null);
      expect(res.statusCode).toEqual(400);
      expectations(res, 'ids', 'Invalid value');
    });
    it('200 - success', async () => {
      const res = await doRequest(agent, 'patch', `${route}/date`, null, accessToken, { ids: [String(insertId)], start: testInsert.date });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(1);
    });
  });

  describe('/api/v1/todo/batchDelete', () => {
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
      expect(res.body).toBe(1);
    });
  });

  describe('/api/v1/todo with apiary_id', () => {
    let todoWithApiaryId: any;

    it('post 200 - create todo with apiary_id', async () => {
      const testInsertWithApiary = {
        ...testInsert,
        name: 'testTodoWithApiary',
        apiary_id: 1,
      };
      const res = await doRequest(agent, 'post', route, null, accessToken, testInsertWithApiary);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      todoWithApiaryId = res.body[0];
    });

    it('get 200 - filter by apiary_id', async () => {
      const res = await doQueryRequest(agent, route, null, accessToken, { apiary_id: 1 });
      expect(res.statusCode).toEqual(200);
      expect(res.body.results).toBeInstanceOf(Array);
    });

    it('batchGet 200 - return apiary data', async () => {
      const res = await doRequest(agent, 'post', `${route}/batchGet`, null, accessToken, { ids: [todoWithApiaryId] });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      if (res.body.length > 0 && res.body[0].apiary_id) {
        expect(res.body[0]).toHaveProperty('apiary');
      }
    });

    it('batchDelete 200 - cleanup', async () => {
      const res = await doRequest(agent, 'patch', `${route}/batchDelete`, null, accessToken, { ids: [todoWithApiaryId] });
      expect(res.statusCode).toEqual(200);
    });
  });
});
