import { Guard } from '../../middlewares/guard.middleware.js';
import { ROLES } from '../../../config/constants.config.js';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import FieldSettingController from '../../controllers/field_setting.controller.js';

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
            } catch (error) {
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
