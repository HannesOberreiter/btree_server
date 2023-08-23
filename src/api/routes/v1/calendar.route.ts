import { Guard } from '../../hooks/guard.hook.js';
import { ROLES } from '../../../config/constants.config.js';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import CalendarController from '../../controllers/calendar.controller.js';

const CalendarParams = z.object({
  start: z.string(),
  end: z.string(),
});
export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/checkup',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        querystring: CalendarParams,
      },
    },
    CalendarController.getCheckups,
  );

  server.get(
    '/treatment',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        querystring: CalendarParams,
      },
    },
    CalendarController.getTreatments,
  );

  server.get(
    '/harvest',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        querystring: CalendarParams,
      },
    },
    CalendarController.getHarvests,
  );

  server.get(
    '/feed',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        querystring: CalendarParams,
      },
    },
    CalendarController.getFeeds,
  );

  server.get(
    '/movedate',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        querystring: CalendarParams,
      },
    },
    CalendarController.getMovements,
  );

  server.get(
    '/todo',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        querystring: CalendarParams,
      },
    },
    CalendarController.getTodos,
  );

  server.get(
    '/scale_data',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        querystring: CalendarParams,
      },
    },
    CalendarController.getScaleData,
  );

  server.get(
    '/rearing',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        querystring: z
          .object({
            start: z.string().optional(),
            end: z.string().optional(),
            id: z.number().optional(),
          })
          .refine((val) => {
            if (val.start && val.end) return true;
            if (val.id) return true;
            return false;
          }),
      },
    },
    CalendarController.getRearings,
  );

  done();
}
