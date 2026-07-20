import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import CompanyController from '../../controllers/company.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  companyApiKeyResponseSchema,
  companyChangeResponseSchema,
  companyCountResponseSchema,
  companyCouponSchema,
  companyCreateSchema,
  companyDeleteParamsSchema,
  companyImportResponseSchema,
  companyImportSchema,
  companyInvoiceSchema,
  companyPaidResponseSchema,
  companyPatchResponseSchema,
  companyPatchSchema,
  companyPaymentsResponseSchema,
  companyResponseSchema,
} from '../../schemas/company.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: unknown,
  done: () => void,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/apikey',
    {
      schema: { response: { 200: companyApiKeyResponseSchema } },
      preHandler: Guard.authorize([ROLES.admin]),
    },
    CompanyController.getApikey,
  );

  server.get(
    '/count',
    {
      schema: { response: { 200: z.array(companyCountResponseSchema) } },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    CompanyController.getCounts,
  );

  server.get(
    '/download',
    { preHandler: Guard.authorize([ROLES.admin]) },
    CompanyController.download,
  );

  server.patch(
    '',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: companyPatchSchema,
        response: { 200: companyPatchResponseSchema },
      },
    },
    CompanyController.patch,
  );

  server.post(
    '',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        body: companyCreateSchema,
        response: { 200: companyResponseSchema },
      },
    },
    CompanyController.post,
  );

  server.post(
    '/coupon',
    {
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      schema: {
        body: companyCouponSchema,
        response: { 200: companyPaidResponseSchema },
      },
    },
    CompanyController.postCoupon,
  );

  server.post(
    '/invoice',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      schema: {
        body: companyInvoiceSchema,
        response: { 200: companyPaidResponseSchema },
      },
    },
    CompanyController.postInvoice,
  );

  server.delete(
    '/:id',
    {
      schema: {
        params: companyDeleteParamsSchema,
        response: { 200: companyChangeResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin]),
    },
    CompanyController.delete,
  );

  server.post(
    '/import',
    {
      schema: {
        body: companyImportSchema,
        response: { 200: companyImportResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin]),
    },
    CompanyController.import,
  );

  server.get(
    '/payments',
    {
      schema: { response: { 200: companyPaymentsResponseSchema } },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    CompanyController.getPayments,
  );

  done();
}
