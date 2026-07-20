import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import ChargeController from '../../controllers/charge.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  chargeBatchDeleteQuerySchema,
  chargeBatchUpdateSchema,
  chargeCreateSchema,
  chargeIdsSchema,
  chargeListQuerySchema,
  chargePaginatedResponseSchema,
  chargeResponseSchema,
  chargeStockPaginatedResponseSchema,
  chargeStockQuerySchema,
} from '../../schemas/charge.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: unknown,
  done: () => void,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/',
    {
      schema: {
        querystring: chargeListQuerySchema,
        response: { 200: chargePaginatedResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    ChargeController.get,
  );

  server.get(
    '/stock',
    {
      schema: {
        querystring: chargeStockQuerySchema,
        response: { 200: chargeStockPaginatedResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    ChargeController.getStock,
  );

  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        body: chargeBatchUpdateSchema,
        response: { 200: z.number() },
      },
    },
    ChargeController.patch,
  );

  server.post(
    '/',
    {
      schema: {
        body: chargeCreateSchema,
        response: { 200: z.array(z.number()) },
      },
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
    },
    ChargeController.post,
  );

  server.patch(
    '/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        querystring: chargeBatchDeleteQuerySchema,
        body: chargeIdsSchema,
        response: { 200: z.array(chargeResponseSchema) },
      },
    },
    ChargeController.batchDelete,
  );

  server.post(
    '/batchGet',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
      schema: {
        body: chargeIdsSchema,
        response: { 200: z.array(chargeResponseSchema) },
      },
    },
    ChargeController.batchGet,
  );

  done();
}
