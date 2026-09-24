import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  createCharge,
  deleteCharges,
  getChargesByIds,
  listCharges,
  listChargeStock,
  updateCharges,
} from '../../modules/charge.module.js';
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
import { parseResponse } from '../../utils/response.util.js';

export default function routes(
  instance: FastifyInstance,
  _options: unknown,
  done: () => void,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  const db = KyselyServer.getInstance().db;
  server.get(
    '/',
    {
      schema: {
        querystring: chargeListQuerySchema,
        response: { 200: chargePaginatedResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    async (req) => {
      const result = await listCharges(db, req.session.user.user_id, req.query);
      return parseResponse(chargePaginatedResponseSchema, result, req);
    },
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
    async (req) => {
      const result = await listChargeStock(
        db,
        req.session.user.user_id,
        req.query,
      );
      return parseResponse(chargeStockPaginatedResponseSchema, result, req);
    },
  );
  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: { body: chargeBatchUpdateSchema, response: { 200: z.number() } },
    },
    (req) =>
      updateCharges(
        db,
        req.session.user.user_id,
        req.session.user.bee_id,
        req.body,
        (req.session as typeof req.session & { llm?: boolean }).llm === true,
      ),
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
    (req) =>
      createCharge(
        db,
        req.session.user.user_id,
        req.session.user.bee_id,
        req.body,
        (req.session as typeof req.session & { llm?: boolean }).llm === true,
      ),
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
    async (req) => {
      const result = await deleteCharges(
        db,
        req.session.user.user_id,
        req.session.user.bee_id,
        req.body.ids,
        Boolean(req.query.hard),
        Boolean(req.query.restore),
      );
      return parseResponse(z.array(chargeResponseSchema), result, req);
    },
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
    async (req) => {
      const result = await getChargesByIds(
        db,
        req.session.user.user_id,
        req.body.ids,
      );
      return parseResponse(z.array(chargeResponseSchema), result, req);
    },
  );
  done();
}
