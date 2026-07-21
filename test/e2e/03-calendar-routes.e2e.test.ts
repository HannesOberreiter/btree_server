import { beforeAll, describe, expect, it } from 'vitest';

import {
  listCalendarMovements,
  listCalendarRearings,
  listCalendarScaleData,
  listCalendarTasks,
  listCalendarTodos,
} from '../../src/api/modules/calendar.module.js';
import { KyselyServer } from '../../src/servers/kysely.server.js';
import type { TestAgent } from '../utils.js';
import {
  createAgent,
  createAuthenticatedAgent,
  doQueryRequest,
} from '../utils.js';

describe('calendar routes', () => {
  const route = '/api/v1/calendar';
  let agent: TestAgent;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
  });

  describe('/api/v1/calendar/<task>', () => {
    const kinds = [
      '/feed',
      '/treatment',
      '/harvest',
      '/checkup',
      '/rearing',
      '/movedate',
      '/todo',
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
        const res = await doQueryRequest(agent, route + kind, null, null, {
          start: new Date('2020-01-01').toISOString(),
          end: new Date('2020-12-30').toISOString(),
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toBeInstanceOf(Array);
        for (const event of res.body) {
          expect(event).toEqual(
            expect.objectContaining({
              title: expect.any(String),
              start: expect.any(String),
              allDay: expect.any(Boolean),
            }),
          );
        }
      });
    });

    it('operations enforce company isolation', async () => {
      const db = KyselyServer.getInstance().db;
      const companyId = 999_999;
      const range = {
        start: new Date('2020-01-01').toISOString(),
        end: new Date('2030-12-31').toISOString(),
      };
      const results = await Promise.all([
        listCalendarTasks(db, companyId, range, 'checkup'),
        listCalendarMovements(db, companyId, range),
        listCalendarTodos(db, companyId, range),
        listCalendarScaleData(db, companyId, range),
        listCalendarRearings(db, companyId, range),
      ]);
      expect(results.every((result) => result.length === 0)).toBe(true);
    });
  });
});

function expectations(res: any, field: string, _err: string): void {
  expect(res.body.statusCode).toEqual(400);
  if (res.body.issue) {
    expect(res.body.issues).toBeInstanceOf(Array);
    expect(res.body.issues.length).toBeGreaterThan(0);
    expect(
      res.body.issues.filter((error: any) => error.path.includes(field)).length,
    ).toBeGreaterThanOrEqual(1);
  }
  if (res.body.cause) {
    expect(res.body.cause.type).toBe('ModelValidation');
  }
}
