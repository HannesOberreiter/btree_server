import type { TestAgent } from '../../utils/index.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { createAgent, doQueryRequest, doRequest, expectations } from '../../utils/index.js';

const newUser = 'newUser@demo.at';

describe('company User routes', () => {
  const route = '/api/v1/company_user';
  let agent: TestAgent;
  let accessToken: any;

  beforeAll(async () => {
    agent = createAgent();
    const res = await doRequest(agent, 'post', '/api/v1/auth/login', null, null, globalThis.demoUser);
    expect(res.statusCode).toEqual(200);
    expect(res.header, 'set-cookie', /connect.sid=.*; Path=\/; HttpOnly/);
  });

  describe('/api/v1/company_user/user', () => {
    it('401 - no header', async () => {
      const res = await doQueryRequest(createAgent(), `${route}/user`, null, null, null);
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });

    it('add_user 401 - no header', async () => {
      const res = await doRequest(createAgent(), 'post', `${route}/add_user`, null, null, { email: newUser });
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });

    it('200 - get', async () => {
      const res = await doQueryRequest(agent, `${route}/user`, null, accessToken, null);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
    });

    it('add_user 200 - success', async () => {
      const res = await doRequest(agent, 'post', `${route}/add_user`, null, accessToken, { email: newUser });
      expect(res.statusCode).toEqual(200);
      expect(res.body.email, newUser);
      expect(res.body).toHaveProperty('id');
      const newId = res.body.id;
      const res2 = await doRequest(agent, 'delete', `${route}/remove_user`, newId, accessToken, {});
      expect(res2.statusCode).toEqual(200);
      expect(res2.body).toBe(1);
    });
  });

  describe('/api/v1/company_user/', () => {
    it('delete 401 - no header', async () => {
      const res = await doRequest(createAgent(), 'delete', `${route}/1`, null, null, {});
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });

    it('patch 401 - no header', async () => {
      const res = await doRequest(createAgent(), 'patch', `${route}/1`, null, null, { rank: 1 });
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });

    it('patch 400 - missing rank', async () => {
      const res = await doRequest(agent, 'patch', `${route}/1`, null, null, {});
      expect(res.statusCode).toEqual(400);
      expectations(res, 'rank', 'requiredField');
    });

    it('patch 200 - success', async () => {
      const res = await doRequest(agent, 'patch', route, 1, accessToken, { rank: 1 });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(1);
    });
  });
});
