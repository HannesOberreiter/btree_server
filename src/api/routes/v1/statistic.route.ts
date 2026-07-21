import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import StatisticController from '../../controllers/statistic.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import { Validator } from '../../hooks/validator.hook.js';
import {
  permissiveJsonResponseSchema,
  compatibilityQuerySchema,
} from '../../schemas/common.schema.js';
import { numberSchema } from '../../utils/zod.util.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  server.get(
    '/hive_count_total',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
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
        response: { 200: permissiveJsonResponseSchema },
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
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getHarvestHive,
  );
  server.get(
    '/harvest/year',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getHarvestYear,
  );
  server.get(
    '/harvest/apiary',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getHarvestApiary,
  );
  server.get(
    '/harvest/type',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getHarvestType,
  );

  server.get(
    '/feed/hive',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getFeedHive,
  );
  server.get(
    '/feed/year',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getFeedYear,
  );
  server.get(
    '/feed/apiary',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getFeedApiary,
  );
  server.get(
    '/feed/type',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getFeedType,
  );

  server.get(
    '/treatment/hive',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getTreatmentHive,
  );
  server.get(
    '/treatment/year',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getTreatmentYear,
  );
  server.get(
    '/treatment/apiary',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getTreatmentApiary,
  );
  server.get(
    '/treatment/type',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getTreatmentType,
  );

  server.get(
    '/rating/hive',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    StatisticController.getCheckupRatingHive,
  );

  server.get(
    '/varroa',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        querystring: z.object({
          start_date: z.string(),
          end_date: z.string(),
          hive_ids: z.array(numberSchema),
        }),
      },
    },
    StatisticController.getVarroa,
  );

  done();
}
