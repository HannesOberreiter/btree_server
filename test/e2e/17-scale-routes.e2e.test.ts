import type { TestAgent } from '../utils.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { createAgent, createAuthenticatedAgent, doQueryRequest, doRequest } from '../utils.js';

const testInsert = {
  hive_id: 1,
  name: 'testScale',
};
const testInsert2 = {
  hive_id: 1,
  name: 'testScale2',
};

describe('scale routes', () => {
  const route = '/api/v1/scale';
  let agent: TestAgent;
  let accessToken: any;
  let insertId: any;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
    const res2 = await doRequest(agent, 'post', route, null, accessToken, testInsert);
    expect(res2.statusCode).toEqual(200);
    expect(res2.body).toBeTypeOf('object');
    const res3 = await doRequest(agent, 'post', route, null, accessToken, testInsert2);
    expect(res3.statusCode).toEqual(200);
    expect(res3.body).toBeTypeOf('object');
    insertId = res3.body.id;
  });

  describe('/api/v1/scale/', () => {
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
      expect(res.body).toBeInstanceOf(Array);
    });

    it('post 400 - no data', async () => {
      const res = await doRequest(agent, 'post', route, null, accessToken, null);
      expect(res.statusCode).toEqual(400);
    });

    it('patch 200 - success', async () => {
      const res = await doRequest(agent, 'patch', route, null, accessToken, { ids: [insertId], data: { name: 'updatedName' } });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(1);
    });
  });

  describe('/api/v1/scale/:id', () => {
    it('get 401 - no header', async () => {
      const res = await doQueryRequest(createAgent(), route, insertId, null, null);
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });
    it('delete 401 - no header', async () => {
      const res = await doRequest(createAgent(), 'delete', route, insertId, null, testInsert);
      expect(res.statusCode).toEqual(401);
      expect(res.errors, 'JsonWebTokenError');
    });

    it('get 200 - success', async () => {
      const res = await doQueryRequest(agent, route, insertId, accessToken, null);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
    });

    it('delete 200 - success', async () => {
      const res = await doRequest(agent, 'delete', route, insertId, accessToken, testInsert);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBe(1);
    });
  });
});
