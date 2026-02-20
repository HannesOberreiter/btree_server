import type { TestAgent } from '../../utils/index.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { createAgent, doRequest, expectations } from '../../utils/index.js';

const testInsert = {
  type_id: 1,
  detail_id: 1,
  position: 1,
};

describe('rearing Step routes', () => {
  const route = '/api/v1/rearing_step';
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
    expect(res2.body).toBeTypeOf('object');
    insertId = res2.body.id;
  });

  describe('/api/v1/rearing_step/', () => {
    it('post 401 - no header', async () => {
      const res = await doRequest(createAgent(), 'post', route, null, null, testInsert);
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('post 400 - no data', async () => {
      const res = await doRequest(agent, 'post', route, null, accessToken, null);
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('/api/v1/rearing_step/updatePosition', () => {
    it('401 - no header', async () => {
      const res = await doRequest(createAgent(), 'patch', `${route}/updatePosition`, null, null, { data: [] });
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('400 - missing value', async () => {
      const res = await doRequest(agent, 'patch', `${route}/updatePosition`, null, null, null);
      expect(res.statusCode).toEqual(400);
      expectations(res, 'data', 'Invalid value');
    });
    it('200 - success', async () => {
      const res = await doRequest(agent, 'patch', `${route}/updatePosition`, null, accessToken, { data: [{ id: insertId, position: 10, sleep_before: 0 }] });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
    });
  });

  describe('/api/v1/rearing_step/:id', () => {
    it('401 - no header', async () => {
      const res = await doRequest(createAgent(), 'delete', route, insertId, null, { ids: [] });
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });

    it('200 - success', async () => {
      const res = await doRequest(agent, 'delete', route, insertId, accessToken, {});
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(1);
    });
  });
});
