import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  createWaxInventory,
  createWaxOperation,
  deleteWaxLot,
  deleteWaxOperation,
  listWaxLots,
  listWaxOperations,
  reverseWaxOperation,
} from '../../modules/wax.module.js';
import {
  waxInventoryCreateSchema,
  waxListQuerySchema,
  waxLotListResponseSchema,
  waxOperationCreateSchema,
  waxOperationListQuerySchema,
  waxOperationListResponseSchema,
  waxOperationParamsSchema,
  waxOperationResponseSchema,
} from '../../schemas/wax.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: unknown,
  done: () => void,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  const db = KyselyServer.getInstance().db;
  server.get(
    '/lots',
    {
      schema: {
        querystring: waxListQuerySchema,
        response: { 200: waxLotListResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    (request) => listWaxLots(db, request.session.user.user_id, request.query),
  );
  server.get(
    '/operations',
    {
      schema: {
        querystring: waxOperationListQuerySchema,
        response: { 200: waxOperationListResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    (request) =>
      listWaxOperations(db, request.session.user.user_id, request.query),
  );
  server.post(
    '/operations',
    {
      schema: {
        body: waxOperationCreateSchema,
        response: { 200: waxOperationResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
    },
    (request) =>
      createWaxOperation(
        db,
        {
          companyId: request.session.user.user_id,
          beeId: request.session.user.bee_id,
        },
        request.body,
      ),
  );
  server.post(
    '/operations/inventory',
    {
      schema: {
        body: waxInventoryCreateSchema,
        response: { 200: waxOperationResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
    },
    (request) =>
      createWaxInventory(
        db,
        {
          companyId: request.session.user.user_id,
          beeId: request.session.user.bee_id,
        },
        request.body,
      ),
  );
  server.delete(
    '/lots/:id',
    {
      schema: {
        params: waxOperationParamsSchema,
        response: { 200: z.boolean() },
      },
      preHandler: Guard.authorize([ROLES.admin]),
    },
    (request) =>
      deleteWaxLot(db, request.session.user.user_id, request.params.id),
  );
  server.delete(
    '/operations/:id',
    {
      schema: {
        params: waxOperationParamsSchema,
        response: { 200: z.boolean() },
      },
      preHandler: Guard.authorize([ROLES.admin]),
    },
    (request) =>
      deleteWaxOperation(db, request.session.user.user_id, request.params.id),
  );
  server.post(
    '/operations/:id/reverse',
    {
      schema: {
        params: waxOperationParamsSchema,
        response: { 200: waxOperationResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
    },
    (request) =>
      reverseWaxOperation(
        db,
        {
          companyId: request.session.user.user_id,
          beeId: request.session.user.bee_id,
        },
        request.params.id,
      ),
  );
  done();
}
