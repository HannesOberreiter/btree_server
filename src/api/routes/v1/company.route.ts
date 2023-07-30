import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@/config/constants.config';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import CompanyController from '@/api/controllers/company.controller';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  server.get(
    '/apikey',
    { preHandler: Guard.authorize([ROLES.admin]) },
    CompanyController.getApikey,
  );
  server.get(
    '/count',
    { preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]) },
    CompanyController.getCounts,
  );
  server.get(
    '/download',
    { preHandler: Guard.authorize([ROLES.admin]) },
    CompanyController.download,
  );
  server.patch(
    '/',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: z.object({
          name: z.string().min(3).max(128).trim().optional(),
        }),
      },
    },
    CompanyController.patch,
  );

  server.post(
    '/',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        body: z.object({
          name: z.string().min(3).max(128).trim(),
        }),
      },
    },
    CompanyController.post,
  );

  server.post(
    '/coupon',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        body: z.object({
          coupon: z.string().min(3).max(128).trim(),
        }),
      },
    },
    CompanyController.postCoupon,
  );

  server.delete(
    '/:id',
    { preHandler: Guard.authorize([ROLES.admin]) },
    CompanyController.delete,
  );

  done();
}
