import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ROLES } from '../../../config/constants.config.js';
import FieldSettingController from '../../controllers/field_setting.controller.js';
import { Guard } from '../../hooks/guard.hook.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  server.get(
    '/',
    { preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]) },
    FieldSettingController.get,
  );
  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        body: z.object({
          settings: z.custom<string>((data: any) => {
            try {
              JSON.parse(data);
            }
            catch (error) {
              return false;
            }
            return true;
          }, 'invalid json'),
        }),
      },
    },
    FieldSettingController.patch,
  );

  done();
}
