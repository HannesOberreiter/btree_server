import { beforeAll, describe, expect, it } from 'vitest';
import { createAgent, doRequest, doQueryRequest, expectations, type TestAgent } from '../../utils/index.js';

describe('calendar routes', () => {
  const route = '/api/v1/calendar';
  let agent: TestAgent;

  beforeAll(async () => {
    agent = createAgent();
    const res = await doRequest(agent, 'post', '/api/v1/auth/login', null, null, globalThis.demoUser);
    expect(res.statusCode).toEqual(200);
    expect(res.header, 'set-cookie', /connect.sid=.*; Path=\/; HttpOnly/);
  });

  describe('/api/v1/calendar/<task>', () => {
    const kinds = [
      '/feed',
      '/treatment',
      '/harvest',
      '/checkup',
      '/rearing',
      '/movedate',
      '/scale_data',
    ];
    kinds.forEach((kind) => {
      it(`${kind} 400 - empty payload`, async () => {
        const res = await doQueryRequest(agent, route + kind, null, null, {});
        expect(res.statusCode).toEqual(400);
        if (kind !== '/rearing') {
          expectations(res, 'start', 'Invalid value');
          expectations(res, 'end', 'Invalid value');
        }
      });

      it(`${kind} 401 - no header`, async () => {
        const res = await doQueryRequest(
          createAgent(),
          route + kind,
          null,
          null,
          { start: new Date().toISOString(), end: new Date().toISOString() },
        );
        expect(res.statusCode).toEqual(401);
        expect(res.errors, 'JsonWebTokenError');
      });

      it(`${kind} 200 - success`, async () => {
        const res = await doQueryRequest(
          agent,
          route + kind,
          null,
          null,
          {
            start: new Date('2020-01-01').toISOString(),
            end: new Date('2020-12-30').toISOString(),
          },
        );
        expect(res.statusCode).toEqual(200);
        expect(res.body).toBeInstanceOf(Array);
      });
    });
  });
});
