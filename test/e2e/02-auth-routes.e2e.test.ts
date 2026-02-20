import type { TestAgent } from '../utils.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { createAgent, demoUser, doQueryRequest, doRequest, expectations } from '../utils.js';

const inactiveUser = {
  email: `inactive${Date.now()}@btree.at`,
  password: 'test_btree',
  name: 'Test Beekeeper',
  lang: 'en',
  newsletter: false,
  source: '0',
};

describe('authentification routes', () => {
  let agent: TestAgent;
  let confirmToken: any;

  beforeAll(async () => {
    agent = createAgent();
    const res = await doRequest(agent, 'post', '/api/v1/auth/register', null, null, demoUser);
    expect(res.statusCode).toEqual(200);
    expect(res.body.email, demoUser.email);
    expect(res.body.activate).toBeTypeOf('string');
    confirmToken = res.body.activate;
    const res2 = await doRequest(agent, 'post', '/api/v1/auth/register', null, null, inactiveUser);
    expect(res2.statusCode).toEqual(200);
    expect(res2.body.email, demoUser.email);
    expect(res2.body.activate).toBeTypeOf('string');
  });

  describe('/api/v1/auth/register', () => {
    const route = '/api/v1/auth/register';

    it('400 - empty payload', async () => {
      const res = await doRequest(agent, 'post', route, null, null, {});
      expect(res.statusCode).toEqual(400);
    });

    it('400 - wrong confirm', async () => {
      const res = await doRequest(agent, 'patch', '/api/v1/auth/confirm', null, null, { confirm: 'test' });
      expectations(res, 'confirm', 'Invalid value');
    });

    it('200 - confirm email', async () => {
      const res = await doRequest(agent, 'patch', '/api/v1/auth/confirm', null, null, { confirm: confirmToken });
      expect(res.statusCode).toEqual(200);
      expect(res.body.email, demoUser.email);
    });
  });

  describe('/api/v1/auth/login', () => {
    const route = '/api/v1/auth/login';

    it('400 - empty payload', async () => {
      const res = await doRequest(agent, 'post', route, null, null, {});
      expect(res.statusCode).toEqual(400);
    });

    it('400 - inactive user', async () => {
      const res = await doRequest(agent, 'post', route, null, null, { email: inactiveUser.email, password: inactiveUser.password });
      expect(res.statusCode).toEqual(401);
    });

    it('400 - too short password', async () => {
      const res = await doRequest(agent, 'post', route, null, null, { email: 'test@test.at', password: 'tes' });
      expectations(res, 'password', 'Invalid value');
    });

    it('403 - wrong password', async () => {
      const res = await doRequest(agent, 'post', route, null, null, { email: demoUser.email, password: 'testseet22' });
      expect(res.statusCode).toEqual(403);
    });

    it('403 - wrong email', async () => {
      const res = await doRequest(agent, 'post', route, null, null, { email: 'demo_@btree.at', password: 'testseet22' });
      expect(res.statusCode).toEqual(403);
    });

    it('200 - login', async () => {
      const res = await doRequest(agent, 'post', route, null, null, demoUser);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toBeTypeOf('object');
      expect(res.header).toHaveProperty('set-cookie');
      expect(res.header['set-cookie'][0]).toMatch(/_auth-btree-session=.*; Path=\/.*HttpOnly/);
    });
  });

  describe('/api/v1/auth/unsubscribe', () => {
    const route = '/api/v1/auth/unsubscribe';
    it('200 - success', async () => {
      const res = await doRequest(agent, 'patch', route, null, null, { email: demoUser.email });
      expect(res.statusCode).toEqual(200);
      expect(res.body.email, demoUser.email);
    });
  });

  describe('/api/v1/auth/reset', () => {
    const route = '/api/v1/auth/reset';
    const newPassword = 'newPassword';

    it('200 - success', async () => {
      const res = await doRequest(agent, 'post', route, null, null, { email: inactiveUser.email });
      expect(res.statusCode).toEqual(200);
      expect(res.body.email, inactiveUser.email);
      expect(res.body.token).toBeTypeOf('string');
      const res2 = await doRequest(agent, 'patch', route, null, null, { key: res.body.token, password: newPassword });
      expect(res2.statusCode).toEqual(200);
      expect(res2.body.email, inactiveUser.email);
      const res3 = await doRequest(agent, 'post', '/api/v1/auth/login', null, null, { email: res2.body.email, password: newPassword });
      expect(res3.statusCode).toEqual(200);
      expect(res3.body.data).toBeTypeOf('object');
    });
  });

  describe('/api/v1/auth/discourse', () => {
    const route = '/api/v1/auth/discourse';
    const sso = 'payload=bm9uY2U9OTJkYWQ0NTMxZTBhZDIwMmY4MWMxYWM0NzVmYjQ5MDMmcmV0dXJuX3Nzb191cmw9aHR0cHMlM0ElMkYlMkZmb3J1bS5idHJlZS5hdCUyRnNlc3Npb24lMkZzc29fbG9naW4%3D&sig=e18fcf73285bdf65610b43ca2e80712175e660571d1d934c08d9499679a52ad0';

    it('400 - bad request', async () => {
      const res = await doQueryRequest(agent, route, null, null, null);
      expect(res.statusCode).toEqual(400);
    });

    it('401 - unauthorized', async () => {
      const res = await doQueryRequest(createAgent(), `${route}?${sso}`, null, null, null);
      expect(res.statusCode).toEqual(401);
    });

    it('200 - discourse payload', async () => {
      const loginRes = await doRequest(agent, 'post', '/api/v1/auth/login', null, null, demoUser);
      expect(loginRes.statusCode).toEqual(200);
      expect(loginRes.body.data).toBeTypeOf('object');
      const res = await doQueryRequest(agent, `${route}?${sso}`, null, null, null);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeTypeOf('object');
      expect(res.body.q).toContain('sso');
    });
  });

  describe('/api/v1/user/', () => {
    const route = '/api/v1/user/';
    it('200 - checkpassword', async () => {
      const loginRes = await doRequest(agent, 'post', '/api/v1/auth/login', null, null, demoUser);
      expect(loginRes.statusCode).toEqual(200);
      expect(loginRes.body.data).toBeTypeOf('object');
      const res = await doRequest(agent, 'post', `${route}checkpassword`, null, null, demoUser);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(true);
    });
  });
});
