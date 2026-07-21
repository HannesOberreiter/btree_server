import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { ROLES } from '../../../config/constants.config.js';
import FieldSettingController from '../../controllers/field_setting.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  permissiveJsonResponseSchema,
  compatibilityQuerySchema,
} from '../../schemas/common.schema.js';
import { patchBodySchema } from '../../schemas/field_setting.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  server.get(
    '/',
    {
      schema: {
        querystring: compatibilityQuerySchema,
        response: { 200: permissiveJsonResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    FieldSettingController.get,
  );
  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        response: { 200: permissiveJsonResponseSchema },
        body: patchBodySchema,
      },
    },
    FieldSettingController.patch,
  );

  done();
}
