import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import CalendarController from '../../controllers/calendar.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
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
  const guardedRoute = () => ({
    preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    schema: {
      querystring: calendarRangeQuerySchema,
      response: { 200: calendarResponseSchema },
    },
  });

  server.get('/checkup', guardedRoute(), CalendarController.getCheckups);
  server.get('/treatment', guardedRoute(), CalendarController.getTreatments);
  server.get('/harvest', guardedRoute(), CalendarController.getHarvests);
  server.get('/feed', guardedRoute(), CalendarController.getFeeds);
  server.get('/movedate', guardedRoute(), CalendarController.getMovements);
  server.get('/todo', guardedRoute(), CalendarController.getTodos);
  server.get('/scale_data', guardedRoute(), CalendarController.getScaleData);

  server.get(
    '/rearing',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        querystring: calendarRearingQuerySchema,
        response: { 200: calendarResponseSchema },
      },
    },
    CalendarController.getRearings,
  );

  done();
}
