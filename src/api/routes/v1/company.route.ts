import { Buffer } from 'node:buffer';
import { Stream } from 'node:stream';

import archiver from 'archiver';
import dayjs from 'dayjs';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import httpErrors from 'http-errors';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import type { MailLang } from '../../../services/mail.service.js';
import { MailLangs } from '../../../services/mail.service.js';
import { createInvoice } from '../../adapters/foxyoffice.adapter.js';
import UserController from '../../controllers/user.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import {
  createCompany,
  deleteOwnedCompany,
  getCompanyApiKey,
  getCompanyPaymentStats,
  listCompanyCounts,
  redeemCompanyCoupon,
  updateCompany,
} from '../../modules/company.module.js';
import {
  downloadCompanyData,
  importCompanyArchive,
} from '../../modules/company_transfer.module.js';
import { addPremium } from '../../modules/premium.module.js';
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
import type { ChangeCompanyBody } from '../../schemas/user.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: unknown,
  done: () => void,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  const db = KyselyServer.getInstance().db;

  server.get(
    '/apikey',
    {
      schema: { response: { 200: companyApiKeyResponseSchema } },
      preHandler: Guard.authorize([ROLES.admin]),
    },
    async (request) => getCompanyApiKey(db, request.session.user.user_id),
  );

  server.get(
    '/count',
    {
      schema: { response: { 200: z.array(companyCountResponseSchema) } },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    async (request) => listCompanyCounts(db, request.session.user.user_id),
  );

  server.get(
    '/download',
    { preHandler: Guard.authorize([ROLES.admin]) },
    async (request, reply) => {
      const pass = new Stream.PassThrough();
      reply.header('Content-Type', 'application/octet-stream');
      reply.header(
        'Content-Disposition',
        `attachment; filename="btree_data_${Date.now()}.zip"`,
      );
      const archive = archiver('zip');
      archive.on('error', (error) => {
        throw error;
      });
      archive.pipe(pass);
      await downloadCompanyData(db, archive, request.session.user.user_id);
      await archive.finalize();
      return pass;
    },
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
    async (request) =>
      updateCompany(
        db,
        request.session.user.bee_id,
        request.session.user.user_id,
        request.body,
      ),
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
    async (request) =>
      createCompany(db, request.session.user.bee_id, request.body),
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
    async (request) =>
      redeemCompanyCoupon(db, request.session.user.user_id, request.body),
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
    async (request) => {
      const companyId = request.session.user.user_id;
      const recent = await db
        .selectFrom('payments')
        .select('id')
        .where('user_id', '=', companyId)
        .where('type', '=', 'invoice')
        .where('date', '>', dayjs().subtract(7, 'day').toDate())
        .executeTakeFirst();
      if (recent) {
        throw httpErrors.TooManyRequests(
          'An invoice request was already created for this company in the last 7 days.',
        );
      }
      const user = await db
        .selectFrom('bees')
        .select(['email', 'lang'])
        .where('id', '=', request.session.user.bee_id)
        .executeTakeFirstOrThrow();
      const years = Math.max(1, Math.floor(request.body.quantity ?? 1));
      const price = request.body.amount * years;
      const lang =
        user.lang && MailLangs.includes(user.lang as MailLang)
          ? (user.lang as MailLang)
          : 'en';
      await createInvoice(user.email, price, years, 'Invoice', lang, {
        mode: 'invoice',
        paymentTargetDays: 7,
      });
      const { paid } = await addPremium(
        db,
        companyId,
        12 * years,
        price,
        'invoice',
      );
      return { paid };
    },
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
    async (request, reply) => {
      const companyId = await deleteOwnedCompany(
        db,
        request.session.user.bee_id,
        Number(request.params.id),
      );
      (request as FastifyRequest & { body: ChangeCompanyBody }).body = {
        saved_company: companyId,
      };
      return UserController.changeCompany(request, reply);
    },
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
    async (request) => {
      if (!Buffer.isBuffer(request.body.upload)) {
        throw httpErrors.BadRequest('Missing company archive');
      }
      try {
        return await importCompanyArchive(
          db,
          request.session.user.bee_id,
          request.body.upload,
        );
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('No ')) {
          throw httpErrors.BadRequest(error.message);
        }
        throw error;
      }
    },
  );

  server.get(
    '/payments',
    {
      schema: { response: { 200: companyPaymentsResponseSchema } },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
    },
    async (request) => getCompanyPaymentStats(db, request.session.user.user_id),
  );

  done();
}
