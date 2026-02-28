import type { TestAgent } from '../utils.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { createAgent, createAuthenticatedAgent, doQueryRequest, doRequest, expectations } from '../utils.js';

const patchCompanyName = 'newName';
const newCompanyName = 'testCompany';

describe('company routes', () => {
  const route = '/api/v1/company';
  let agent: TestAgent;
  let accessToken: any;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
  });

  describe('/api/v1/company/apikey', () => {
    it('401 - no header', async () => {
      const res = await doQueryRequest(createAgent(), `${route}/apikey`, null, null, null);
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });

    it('200 - get', async () => {
      const res = await doQueryRequest(agent, `${route}/apikey`, null, accessToken, null);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('api_key');
    });
  });

  describe('/api/v1/company/', () => {
    it('patch 400 - name too short', async () => {
      const res = await doRequest(agent, 'patch', route, null, null, { name: 'a' });
      expect(res.statusCode).toEqual(400);
      expectations(res, 'name', 'Invalid value');
    });

    it('patch 401 - no header', async () => {
      const res = await doRequest(createAgent(), 'patch', route, null, null, { name: 'newName' });
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });

    it('patch 200 - success', async () => {
      const res = await doRequest(agent, 'patch', route, null, accessToken, { name: patchCompanyName, api_change: true });
      expect(res.statusCode).toEqual(200);
      expect(res.body.name, patchCompanyName);
    });

    it('post 200 - success', async () => {
      const res = await doRequest(agent, 'post', route, null, accessToken, { name: newCompanyName + new Date().toISOString() });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('id');
      const newCompanyId = res.body.id;
      const responseName = res.body.name;
      const res2 = await doRequest(agent, 'post', route, null, accessToken, { name: responseName });
      expect(res2.statusCode).toEqual(409);
      const res3 = await doRequest(agent, 'delete', route, newCompanyId, accessToken, {});
      expect(res3.statusCode).toEqual(200);
      expect(res3.body.result).toBe(1);
      expect(res3.body.data).toBeTypeOf('object');
    });
  });
});
