import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  getFieldSettings,
  saveFieldSettings,
} from '../../modules/field_setting.module.js';
import {
  fieldSettingPatchResponseSchema,
  fieldSettingResponseSchema,
  patchBodySchema,
} from '../../schemas/field_setting.schema.js';

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
      schema: { response: { 200: fieldSettingResponseSchema } },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    async (request) => getFieldSettings(db, request.session.user.bee_id),
  );

  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        body: patchBodySchema,
        response: { 200: fieldSettingPatchResponseSchema },
      },
    },
    async (request) =>
      saveFieldSettings(db, request.session.user.bee_id, request.body),
  );

  done();
}
