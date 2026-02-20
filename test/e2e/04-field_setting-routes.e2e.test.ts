import { beforeAll, describe, expect, it } from 'vitest';
import { createAgent, doRequest, doQueryRequest, type TestAgent } from '../../utils/index.js';

const settings = JSON.stringify({
  checkup: {
    rating: false,
    queen: false,
    strength: false,
    weight: false,
    temperature: false,
    varroa: false,
    frames: false,
  },
  harvest: { water: false, frames: false },
  treatment: { wait: false, vet: false },
  charge: { price: false, bestbefore: false },
});

describe('fieldsetting routes', () => {
  const route = '/api/v1/field_setting';
  let agent: TestAgent;
  let accessToken: any;

  beforeAll(async () => {
    agent = createAgent();
    const res = await doRequest(agent, 'post', '/api/v1/auth/login', null, null, globalThis.demoUser);
    expect(res.statusCode).toEqual(200);
    expect(res.header, 'set-cookie', /connect.sid=.*; Path=\/; HttpOnly/);
  });

  describe('/api/v1/field_setting', () => {
    it('401 - no header', async () => {
      const res = await doQueryRequest(createAgent(), route, null, null, null);
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });

    it('200 - patch and get', async () => {
      const res = await doRequest(agent, 'patch', route, null, accessToken, { settings });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(JSON.parse(settings));
      const res2 = await doQueryRequest(agent, route, null, accessToken, null);
      expect(res2.statusCode).toEqual(200);
      expect(res2.body).toEqual({ settings: JSON.parse(settings) });
    });
  });
});
