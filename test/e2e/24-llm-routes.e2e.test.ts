import type { TestAgent } from '../utils.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { createAgent, createAuthenticatedAgent, doQueryRequest, doRequest } from '../utils.js';

describe('llm routes', () => {
  const route = '/api/v1/llm';
  let agent: TestAgent;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
  });

  describe('/api/v1/llm/token', () => {
    it('401 - unauthenticated GET', async () => {
      const res = await doQueryRequest(createAgent(), `${route}/token`, null, null, null);
      expect(res.statusCode).toEqual(401);
    });

    it('401 - unauthenticated POST', async () => {
      const res = await doRequest(createAgent(), 'post', `${route}/token`, null, null, {
        provider: 'openai',
        access_token: 'test-key',
      });
      expect(res.statusCode).toEqual(401);
    });

    it('400 - invalid provider on save', async () => {
      const res = await doRequest(agent, 'post', `${route}/token`, null, null, {
        provider: 'unknown_provider',
        access_token: 'test-key',
      });
      expect(res.statusCode).toEqual(400);
    });

    it('400 - missing access_token', async () => {
      const res = await doRequest(agent, 'post', `${route}/token`, null, null, {
        provider: 'openai',
      });
      expect(res.statusCode).toEqual(400);
    });

    it('200 - save openai token', async () => {
      const res = await doRequest(agent, 'post', `${route}/token`, null, null, {
        provider: 'openai',
        access_token: 'sk-test-openai-key',
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body.provider).toEqual('openai');
    });

    it('200 - save mistral token', async () => {
      const res = await doRequest(agent, 'post', `${route}/token`, null, null, {
        provider: 'mistral',
        access_token: 'mst-test-mistral-key',
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body.provider).toEqual('mistral');
    });

    it('200 - list tokens (no secrets exposed)', async () => {
      const res = await doQueryRequest(agent, `${route}/token`, null, null, null);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      // Ensure no actual token values are exposed
      for (const token of res.body) {
        expect(token).not.toHaveProperty('tokens');
        expect(token.provider).toBeTypeOf('string');
      }
    });

    it('200 - upsert (update) openai token', async () => {
      const res = await doRequest(agent, 'post', `${route}/token`, null, null, {
        provider: 'openai',
        access_token: 'sk-test-openai-key-updated',
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body.provider).toEqual('openai');
    });

    it('200 - delete openai token', async () => {
      const res = await doRequest(agent, 'delete', `${route}/token/openai`, null, null, null);
      expect(res.statusCode).toEqual(200);
      expect(res.body.provider).toEqual('openai');
    });

    it('200 - list tokens after delete', async () => {
      const res = await doQueryRequest(agent, `${route}/token`, null, null, null);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      const providers = res.body.map((t: any) => t.provider);
      expect(providers).not.toContain('openai');
    });

    it('200 - delete mistral token', async () => {
      const res = await doRequest(agent, 'delete', `${route}/token/mistral`, null, null, null);
      expect(res.statusCode).toEqual(200);
      expect(res.body.provider).toEqual('mistral');
    });
  });

  describe('/api/v1/llm/chat', () => {
    it('401 - unauthenticated chat', async () => {
      const res = await doRequest(createAgent(), 'post', `${route}/chat`, null, null, {
        provider: 'openai',
        messages: [{ role: 'user', content: 'hello' }],
      });
      expect(res.statusCode).toEqual(401);
    });

    it('400 - invalid provider on chat', async () => {
      const res = await doRequest(agent, 'post', `${route}/chat`, null, null, {
        provider: 'invalid',
        messages: [{ role: 'user', content: 'hello' }],
      });
      expect(res.statusCode).toEqual(400);
    });

    it('400 - empty messages array', async () => {
      const res = await doRequest(agent, 'post', `${route}/chat`, null, null, {
        provider: 'openai',
        messages: [],
      });
      expect(res.statusCode).toEqual(400);
    });

    it('404 - no token configured for chat', async () => {
      const res = await doRequest(agent, 'post', `${route}/chat`, null, null, {
        provider: 'openai',
        messages: [{ role: 'user', content: 'hello' }],
      });
      expect(res.statusCode).toEqual(404);
    });

    it('401 - unauthenticated stream chat', async () => {
      const res = await doRequest(createAgent(), 'post', `${route}/chat/stream`, null, null, {
        provider: 'openai',
        messages: [{ role: 'user', content: 'hello' }],
      });
      expect(res.statusCode).toEqual(401);
    });

    it('404 - no token configured for stream chat', async () => {
      const res = await doRequest(agent, 'post', `${route}/chat/stream`, null, null, {
        provider: 'openai',
        messages: [{ role: 'user', content: 'hello' }],
      });
      expect(res.statusCode).toEqual(404);
    });
  });
});
