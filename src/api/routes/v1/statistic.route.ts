import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { Guard } from '../../hooks/guard.hook.js';
import { Validator } from '../../hooks/validator.hook.js';
import {
  getVarroaStatistics,
  listHiveCountByApiary,
  listHiveCountTotal,
  listHiveRatingStatistics,
  listTaskStatisticsByHive,
  listTaskStatisticsSummary,
} from '../../modules/statistic.module.js';
import {
  hiveCountApiaryQuerySchema,
  hiveCountApiaryResponseSchema,
  hiveCountTotalResponseSchema,
  statisticListQuerySchema,
  statisticSummaryQuerySchema,
  taskStatisticListResponseSchema,
  taskStatisticPageResponseSchema,
  varroaStatisticQuerySchema,
  varroaStatisticResponseSchema,
} from '../../schemas/statistic.schema.js';
import type { StatisticTask } from '../../schemas/statistic.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: unknown,
  done: () => void,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  const db = KyselyServer.getInstance().db;
  const guard = {
    preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    preValidation: Validator.isPremium,
  };

  server.get(
    '/hive_count_total',
    {
      ...guard,
      schema: { response: { 200: hiveCountTotalResponseSchema } },
    },
    async (request) => listHiveCountTotal(db, request.session.user.user_id),
  );

  server.get(
    '/hive_count_apiary',
    {
      ...guard,
      schema: {
        querystring: hiveCountApiaryQuerySchema,
        response: { 200: hiveCountApiaryResponseSchema },
      },
    },
    async (request) =>
      listHiveCountByApiary(
        db,
        request.session.user.user_id,
        new Date(request.query.date),
      ),
  );

  const registerTaskRoutes = (task: StatisticTask) => {
    server.get(
      `/${task}/hive`,
      {
        ...guard,
        schema: {
          querystring: statisticListQuerySchema,
          response: { 200: taskStatisticPageResponseSchema },
        },
      },
      async (request) =>
        listTaskStatisticsByHive(
          db,
          request.session.user.user_id,
          task,
          request.query,
        ),
    );

    for (const mode of ['year', 'apiary', 'type'] as const) {
      server.get(
        `/${task}/${mode}`,
        {
          ...guard,
          schema: {
            querystring: statisticSummaryQuerySchema,
            response: { 200: taskStatisticListResponseSchema },
          },
        },
        async (request) =>
          listTaskStatisticsSummary(
            db,
            request.session.user.user_id,
            task,
            mode,
            request.query,
          ),
      );
    }
  };

  registerTaskRoutes('harvest');
  registerTaskRoutes('feed');
  registerTaskRoutes('treatment');

  server.get(
    '/rating/hive',
    {
      ...guard,
      schema: {
        querystring: statisticListQuerySchema,
        response: { 200: taskStatisticPageResponseSchema },
      },
    },
    async (request) =>
      listHiveRatingStatistics(db, request.session.user.user_id, request.query),
  );

  server.get(
    '/varroa',
    {
      ...guard,
      schema: {
        querystring: varroaStatisticQuerySchema,
        response: { 200: varroaStatisticResponseSchema },
      },
    },
    async (request) =>
      getVarroaStatistics(db, request.session.user.user_id, request.query),
  );

  done();
}
