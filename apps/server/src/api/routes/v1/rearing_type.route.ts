import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  createRearingType,
  deleteRearingTypes,
  getRearingTypesByIds,
  listRearingTypes,
  updateRearingTypes,
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
} from '../../schemas/rearing_type.schema.js';
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
    (req) => listRearingTypes(db, req.session.user.user_id, req.query),
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
    (req) => updateRearingTypes(db, req.session.user.user_id, req.body),
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
    (req) => createRearingType(db, req.session.user.user_id, req.body),
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
    (req) => deleteRearingTypes(db, req.session.user.user_id, req.body.ids),
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
    (req) => getRearingTypesByIds(db, req.session.user.user_id, req.body.ids),
  );
  done();
}
