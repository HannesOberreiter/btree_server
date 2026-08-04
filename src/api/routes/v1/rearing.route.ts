import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  createRearing,
  deleteRearings,
  getRearingsByIds,
  listRearings,
  updateRearingDates,
  updateRearings,
} from '../../modules/rearing.module.js';
import {
  compatibilityQuerySchema,
  permissiveJsonResponseSchema,
} from '../../schemas/common.schema.js';
import {
  batchDeleteBodySchema,
  batchGetBodySchema,
  patchBodySchema,
  postBodySchema,
  updateDateBodySchema,
} from '../../schemas/rearing.schema.js';
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
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    (req) => listRearings(db, req.session.user.user_id, req.query),
  );
  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: patchBodySchema,
      },
    },
    (req) =>
      updateRearings(
        db,
        req.session.user.user_id,
        req.session.user.bee_id,
        req.body,
      ),
  );
  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: postBodySchema,
      },
    },
    (req) =>
      createRearing(
        db,
        req.session.user.user_id,
        req.session.user.bee_id,
        req.body,
      ),
  );
  server.patch(
    '/date',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: updateDateBodySchema,
      },
    },
    (req) =>
      updateRearingDates(
        db,
        req.session.user.user_id,
        req.session.user.bee_id,
        req.body.ids,
        req.body.start,
      ),
  );
  server.patch(
    '/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: batchDeleteBodySchema,
      },
    },
    (req) => deleteRearings(db, req.session.user.user_id, req.body.ids),
  );
  server.post(
    '/batchGet',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: batchGetBodySchema,
      },
    },
    (req) => getRearingsByIds(db, req.session.user.user_id, req.body.ids),
  );
  done();
}
