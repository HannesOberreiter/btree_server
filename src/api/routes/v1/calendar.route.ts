import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  listCalendarMovements,
  listCalendarRearings,
  listCalendarScaleData,
  listCalendarTasks,
  listCalendarTodos,
} from '../../modules/calendar.module.js';
import {
  calendarRangeQuerySchema,
  calendarRearingQuerySchema,
  calendarResponseSchema,
} from '../../schemas/calendar.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: unknown,
  done: () => void,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  const db = KyselyServer.getInstance().db;
  const guardedRoute = () => ({
    preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    schema: {
      querystring: calendarRangeQuerySchema,
      response: { 200: calendarResponseSchema },
    },
  });

  server.get('/checkup', guardedRoute(), async (request) =>
    listCalendarTasks(
      db,
      request.session.user.user_id,
      request.query,
      'checkup',
    ),
  );
  server.get('/treatment', guardedRoute(), async (request) =>
    listCalendarTasks(
      db,
      request.session.user.user_id,
      request.query,
      'treatment',
    ),
  );
  server.get('/harvest', guardedRoute(), async (request) =>
    listCalendarTasks(
      db,
      request.session.user.user_id,
      request.query,
      'harvest',
    ),
  );
  server.get('/feed', guardedRoute(), async (request) =>
    listCalendarTasks(db, request.session.user.user_id, request.query, 'feed'),
  );
  server.get('/movedate', guardedRoute(), async (request) =>
    listCalendarMovements(db, request.session.user.user_id, request.query),
  );
  server.get('/todo', guardedRoute(), async (request) =>
    listCalendarTodos(db, request.session.user.user_id, request.query),
  );
  server.get('/scale_data', guardedRoute(), async (request) =>
    listCalendarScaleData(db, request.session.user.user_id, request.query),
  );

  server.get(
    '/rearing',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        querystring: calendarRearingQuerySchema,
        response: { 200: calendarResponseSchema },
      },
    },
    async (request) =>
      listCalendarRearings(db, request.session.user.user_id, request.query),
  );

  done();
}
