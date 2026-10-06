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
import { parseResponse } from '../../utils/response.util.js';

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

  server.get('/checkup', guardedRoute(), async (request) => {
    const result = await listCalendarTasks(
      db,
      request.session.user.user_id,
      request.query,
      'checkup',
    );
    return parseResponse(calendarResponseSchema, result, request);
  });
  server.get('/treatment', guardedRoute(), async (request) => {
    const result = await listCalendarTasks(
      db,
      request.session.user.user_id,
      request.query,
      'treatment',
    );
    return parseResponse(calendarResponseSchema, result, request);
  });
  server.get('/harvest', guardedRoute(), async (request) => {
    const result = await listCalendarTasks(
      db,
      request.session.user.user_id,
      request.query,
      'harvest',
    );
    return parseResponse(calendarResponseSchema, result, request);
  });
  server.get('/feed', guardedRoute(), async (request) => {
    const result = await listCalendarTasks(
      db,
      request.session.user.user_id,
      request.query,
      'feed',
    );
    return parseResponse(calendarResponseSchema, result, request);
  });
  server.get('/movedate', guardedRoute(), async (request) => {
    const result = await listCalendarMovements(
      db,
      request.session.user.user_id,
      request.query,
    );
    return parseResponse(calendarResponseSchema, result, request);
  });
  server.get('/todo', guardedRoute(), async (request) =>
    listCalendarTodos(db, request.session.user.user_id, request.query),
  );
  server.get('/scale_data', guardedRoute(), async (request) => {
    const result = await listCalendarScaleData(
      db,
      request.session.user.user_id,
      request.query,
    );
    return parseResponse(calendarResponseSchema, result, request);
  });

  server.get(
    '/rearing',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        querystring: calendarRearingQuerySchema,
        response: { 200: calendarResponseSchema },
      },
    },
    async (request) => {
      const result = await listCalendarRearings(
        db,
        request.session.user.user_id,
        request.query,
      );
      return parseResponse(calendarResponseSchema, result, request);
    },
  );

  done();
}
