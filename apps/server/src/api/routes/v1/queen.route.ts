import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { Guard } from '../../hooks/guard.hook.js';
import { Validator } from '../../hooks/validator.hook.js';
import {
  createQueens,
  deleteQueens,
  getQueenPedigree,
  getQueensByIds,
  listQueens,
  listQueenStats,
  updateQueens,
  updateQueenStatus,
} from '../../modules/queen.module.js';
import { compatibilityQuerySchema } from '../../schemas/common.schema.js';
import {
  batchDeleteBodySchema,
  batchGetBodySchema,
  getPedigreeParamsSchema,
  patchBodySchema,
  postBodySchema,
  updateStatusBodySchema,
  queenPaginatedResponseSchema,
  queenPedigreeResponseSchema,
  queenResponseSchema,
  queenStatsResponseSchema,
} from '../../schemas/queen.schema.js';

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
        querystring: compatibilityQuerySchema,
        response: { 200: queenPaginatedResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    (req) => listQueens(db, req.session.user.user_id, req.query),
  );
  server.get(
    '/stats',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: queenStatsResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.isPremium,
    },
    (req) => listQueenStats(db, req.session.user.user_id, req.query),
  );
  server.get(
    '/pedigree/:id',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        params: getPedigreeParamsSchema,
        response: { 200: queenPedigreeResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    (req) => getQueenPedigree(db, req.session.user.user_id, req.params.id),
  );
  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: z.array(z.number()) },
        body: postBodySchema,
      },
    },
    (req) =>
      createQueens(
        db,
        req.session.user.user_id,
        req.session.user.bee_id,
        req.body,
      ),
  );
  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: z.number() },
        body: patchBodySchema,
      },
    },
    (req) =>
      updateQueens(
        db,
        req.session.user.user_id,
        req.session.user.bee_id,
        req.body,
      ),
  );
  server.patch(
    '/status',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: z.number() },
        body: updateStatusBodySchema,
      },
    },
    (req) =>
      updateQueenStatus(
        db,
        req.session.user.user_id,
        req.session.user.bee_id,
        req.body.ids,
        req.body.status,
      ),
  );
  server.patch(
    '/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: z.array(queenResponseSchema) },
        body: batchDeleteBodySchema,
      },
    },
    (req) =>
      deleteQueens(
        db,
        req.session.user.user_id,
        req.session.user.bee_id,
        req.body.ids,
        Boolean(req.query.hard),
        Boolean(req.query.restore),
      ),
  );
  server.post(
    '/batchGet',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: z.array(queenResponseSchema) },
        body: batchGetBodySchema,
      },
    },
    (req) => getQueensByIds(db, req.session.user.user_id, req.body.ids),
  );
  done();
}
