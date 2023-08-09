import { Guard } from '../../middlewares/guard.middleware.js';
import { ROLES } from '../../../config/constants.config.js';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import StatisticController from '../../controllers/statistic.controller.js';
import { Validator } from '../../middlewares/validator.middleware.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  server.get(
    '/hive_count_total',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getHiveCountTotal,
  );

  server.get(
    '/hive_count_apiary',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
      schema: {
        querystring: z.object({
          date: z.string(),
        }),
      },
    },
    StatisticController.getHiveCountApiary,
  );

  server.get(
    '/harvest/hive',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getHarvestHive,
  );
  server.get(
    '/harvest/year',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getHarvestYear,
  );
  server.get(
    '/harvest/apiary',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getHarvestApiary,
  );
  server.get(
    '/harvest/type',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getHarvestType,
  );

  server.get(
    '/feed/hive',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getFeedHive,
  );
  server.get(
    '/feed/year',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getFeedYear,
  );
  server.get(
    '/feed/apiary',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getFeedApiary,
  );
  server.get(
    '/feed/type',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getFeedType,
  );

  server.get(
    '/treatment/hive',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getTreatmentHive,
  );
  server.get(
    '/treatment/year',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getTreatmentYear,
  );
  server.get(
    '/treatment/apiary',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getTreatmentApiary,
  );
  server.get(
    '/treatment/type',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getTreatmentType,
  );

  server.get(
    '/rating/hive',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getCheckupRatingHive,
  );

  done();
}
