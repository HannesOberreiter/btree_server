import { beforeAll, describe, expect, it } from 'vitest';

import { getDropboxTokens } from '../../src/api/modules/dropbox.module.js';
import { KyselyServer } from '../../src/servers/kysely.server.js';
import type { TestAgent } from '../utils.js';
import { createAgent, createAuthenticatedAgent } from '../utils.js';

describe('dropbox routes', () => {
  const route = '/api/v1/dropbox';
  let agent: TestAgent;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
  });

  it('get 401 - no session', async () => {
    const response = await createAgent().request('get', route);
    expect(response.statusCode).toBe(401);
  });

  it('get 200 - authorization URL', async () => {
    const response = await agent.request('get', route);
    expect(response.statusCode).toBe(200);
    expect(response.body.url).toContain('dropbox.com/oauth2/authorize');
  });

  it('get 200 - no stored token', async () => {
    const response = await agent.request('get', `${route}/token`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({});
  });

  it('delete 404 - no stored token', async () => {
    const response = await agent.request('delete', route, {});
    expect(response.statusCode).toBe(404);
  });

  it('operation enforces company isolation', async () => {
    const result = await getDropboxTokens(
      KyselyServer.getInstance().db,
      999_999,
    );
    expect(result).toBeNull();
  });
});
