import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';
import { Stream } from 'node:stream';

import archiver from 'archiver';
import dayjs from 'dayjs';
import type { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';
import { sql } from 'kysely';

import { KyselyServer } from '../../servers/kysely.server.js';
import type { MailLang } from '../../services/mail.service.js';
import { MailLangs } from '../../services/mail.service.js';
import UserController from '../controllers/user.controller.js';
import {
  downloadCompanyData,
  importCompanyArchive,
} from '../modules/company_transfer.module.js';
import type {
  CompanyCouponBody,
  CompanyCreateBody,
  CompanyDeleteParams,
  CompanyImportBody,
  CompanyInvoiceBody,
  CompanyPatchBody,
} from '../schemas/company.schema.js';
import { autoFill } from '../utils/autofill.util.js';
import { deleteCompany } from '../utils/delete.util.js';
import { createInvoice } from '../utils/foxyoffice.util.js';
import { reviewPassword } from '../utils/login.util.js';
import {
  addPremium,
  isPremium,
  premiumPaidDate,
} from '../utils/premium.util.js';

const PROMO_COOLDOWN_HOURS = 48;

export default class CompanyController {
  static async postCoupon(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as CompanyCouponBody;
    const user_id = req.session.user.user_id;
    const db = KyselyServer.getInstance().db;

    const paid = await db.transaction().execute(async (trx) => {
      await trx
        .selectFrom('companies')
        .select('id')
        .where('id', '=', user_id)
        .forUpdate()
        .executeTakeFirstOrThrow();

      const cooldownStarted = new Date(
        Date.now() - PROMO_COOLDOWN_HOURS * 60 * 60 * 1000,
      );
      const recentPromo = await trx
        .selectFrom('promos')
        .select('id')
        .where('user_id', '=', user_id)
        .where('used', '=', true)
        .where('date', '>', cooldownStarted)
        .executeTakeFirst();
      if (recentPromo) {
        throw httpErrors.TooManyRequests('promoCooldown');
      }

      const promo = await trx
        .selectFrom('promos')
        .select(['id', 'months'])
        .where('code', '=', body.coupon)
        .where('used', '=', false)
        .forUpdate()
        .executeTakeFirst();
      if (!promo) {
        throw httpErrors.NotFound();
      }

      const months = promo.months ?? 12;
      await trx
        .updateTable('companies')
        .set({ paid: premiumPaidDate(months) })
        .where('id', '=', user_id)
        .executeTakeFirst();

      await trx
        .insertInto('payments')
        .values({
          date: new Date(),
          user_id,
          months,
          amount: 0,
          type: 'promo',
        })
        .executeTakeFirst();

      await trx
        .updateTable('promos')
        .set({
          used: true,
          date: new Date(),
          user_id,
        })
        .where('id', '=', promo.id)
        .executeTakeFirst();

      const result = await trx
        .selectFrom('companies')
        .select('paid')
        .where('id', '=', user_id)
        .executeTakeFirstOrThrow();
      return result.paid;
    });
    return { paid };
  }

  /**
   * Create an open (bank-transfer) invoice for the logged-in company.
   * Guards against repeat requests within 7 days. Premium is granted
   * immediately; the invoice PDF is emailed to the user with a 7 day
   * payment target.
   */
  static async postInvoice(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as CompanyInvoiceBody;
    const user_id = req.session.user.user_id;
    const bee_id = req.session.user.bee_id;

    // Re-request guard: no more than one 'invoice' Payment per 7 days
    const db = KyselyServer.getInstance().db;
    const recent = await db
      .selectFrom('payments')
      .select('id')
      .where('user_id', '=', user_id)
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
      .where('id', '=', bee_id)
      .executeTakeFirstOrThrow();

    const years = Math.max(1, Math.floor(body.quantity ?? 1));
    const price = body.amount * years;

    const lang =
      user.lang && MailLangs.includes(user.lang as MailLang)
        ? (user.lang as MailLang)
        : 'en';

    // Create FoxyOffice invoice + send PDF email (with 7 day payment target)
    await createInvoice(user.email, price, years, 'Invoice', lang, {
      mode: 'invoice',
      paymentTargetDays: 7,
    });

    // Grant premium immediately (same as other payment flows).
    const paid = await addPremium(user_id, 12 * years, price, 'invoice');

    return { paid };
  }

  static async download(req: FastifyRequest, reply: FastifyReply) {
    const pass = new Stream.PassThrough();

    reply.header('Content-Type', 'application/octet-stream');
    reply.header(
      'Content-Disposition',
      `attachment; filename="btree_data_${Date.now()}.zip"`,
    );

    const arch = archiver('zip');
    arch.on('error', (err) => {
      throw err;
    });
    arch.pipe(pass);

    await downloadCompanyData(
      KyselyServer.getInstance().db,
      arch,
      req.session.user.user_id,
    );
    await arch.finalize();
    return pass;
  }

  static async getApikey(req: FastifyRequest, _reply: FastifyReply) {
    const premium = await isPremium(req.session.user.user_id);
    if (!premium) {
      throw httpErrors.PaymentRequired();
    }
    const result = await KyselyServer.getInstance()
      .db.selectFrom('companies')
      .select('api_key')
      .where('id', '=', req.session.user.user_id)
      .executeTakeFirst();
    return { ...result };
  }

  static async getCounts(req: FastifyRequest, _reply: FastifyReply) {
    return KyselyServer.getInstance()
      .db.selectFrom('counts')
      .selectAll()
      .where('user_id', '=', req.session.user.user_id)
      .execute();
  }

  static async delete(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as CompanyDeleteParams;
    const db = KyselyServer.getInstance().db;
    const companyId = Number(params.id);
    const otherUser = await db
      .selectFrom('company_bee')
      .select('bee_id')
      .where('user_id', '=', companyId)
      .where('bee_id', '!=', req.session.user.bee_id)
      .executeTakeFirst();
    if (otherUser) {
      reply.send(
        httpErrors.Forbidden('Other user(s) found, please remove them first.'),
      );
      return;
    }

    const otherCompany = await db
      .selectFrom('company_bee')
      .select('user_id')
      .where('bee_id', '=', req.session.user.bee_id)
      .where('user_id', '!=', companyId)
      .executeTakeFirst();
    if (!otherCompany?.user_id) {
      reply.send(
        httpErrors.Forbidden(
          'This is your last company, you cannot delete it.',
        ),
      );
      return;
    }

    (req as FastifyRequest & { body: { saved_company: number } }).body = {
      saved_company: otherCompany.user_id,
    };
    await deleteCompany(companyId);
    return UserController.changeCompany(req, reply);
  }

  static async post(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as CompanyCreateBody;
    const db = KyselyServer.getInstance().db;
    return db.transaction().execute(async (trx) => {
      const existing = await trx
        .selectFrom('companies')
        .innerJoin('company_bee', 'company_bee.user_id', 'companies.id')
        .select('companies.id')
        .where('companies.name', '=', body.name)
        .where('company_bee.bee_id', '=', req.session.user.bee_id)
        .executeTakeFirst();
      if (existing) throw httpErrors.Conflict('Company name already exists');

      const companyInsert = await trx
        .insertInto('companies')
        .values({ name: body.name })
        .executeTakeFirstOrThrow();
      const companyId = Number(companyInsert.insertId);
      const user = await trx
        .selectFrom('bees')
        .select('lang')
        .where('id', '=', req.session.user.bee_id)
        .executeTakeFirstOrThrow();
      await trx
        .insertInto('company_bee')
        .values({ bee_id: req.session.user.bee_id, user_id: companyId })
        .execute();
      await autoFill(trx, companyId, user.lang ?? 'en');
      return trx
        .selectFrom('companies')
        .selectAll()
        .where('id', '=', companyId)
        .executeTakeFirstOrThrow();
    });
  }

  static async patch(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as CompanyPatchBody;
    if (body.password !== undefined) {
      await reviewPassword(req.session.user.bee_id, body.password);
    }
    const db = KyselyServer.getInstance().db;
    return db.transaction().execute(async (trx) => {
      const company = await trx
        .selectFrom('companies')
        .selectAll()
        .where('id', '=', req.session.user.user_id)
        .executeTakeFirstOrThrow();
      if (body.api_change !== undefined) {
        if (!(await isPremium(req.session.user.user_id, trx))) {
          throw httpErrors.PaymentRequired();
        }
      }
      const regenerateKey =
        body.api_change === true || (company.api_active && !company.api_key);
      await trx
        .updateTable('companies')
        .set({
          ...(body.name !== undefined && { name: body.name }),
          ...(regenerateKey && { api_key: randomBytes(25).toString('hex') }),
        })
        .where('id', '=', req.session.user.user_id)
        .execute();
      const result = await trx
        .selectFrom('companies')
        .selectAll()
        .where('id', '=', req.session.user.user_id)
        .executeTakeFirstOrThrow();
      const { api_key: _apiKey, image: _image, ...safeResult } = result;
      return safeResult;
    });
  }

  /**
   * @description Import data for new company from CSV files, which are previously generated by the download function.
   */
  static async import(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as CompanyImportBody & { upload: Buffer };
    try {
      return await importCompanyArchive(
        KyselyServer.getInstance().db,
        req.session.user.bee_id,
        body.upload,
      );
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('No ')) {
        throw httpErrors.BadRequest(error.message);
      }
      throw error;
    }
  }

  /**
   * @description Basic payment statistics for the user and global.
   */
  static async getPayments(req: FastifyRequest, _reply: FastifyReply) {
    const user_id = req.session.user.user_id;
    const db = KyselyServer.getInstance().db;
    const paymentsUser = await db
      .selectFrom('payments')
      .select(['id', 'date', 'amount', 'months'])
      .where('user_id', '=', user_id)
      .orderBy('date', 'desc')
      .execute();

    const paymentsCountCurrentYear = await db
      .selectFrom('payments')
      .select(sql<number>`COUNT(id)`.as('count'))
      .where(sql<boolean>`YEAR(date) = YEAR(CURDATE())`)
      .executeTakeFirstOrThrow();

    const paymentsCountLastYear = await db
      .selectFrom('payments')
      .select(sql<number>`COUNT(id)`.as('count'))
      .where(sql<boolean>`YEAR(date) = YEAR(CURDATE()) - 1`)
      .executeTakeFirstOrThrow();

    return {
      company: {
        count: paymentsUser.length,
        months: paymentsUser.reduce(
          (acc, payment) => acc + (payment.months ?? 0),
          0,
        ),
      },
      countCurrentYear: paymentsCountCurrentYear.count,
      countLastYear: paymentsCountLastYear.count,
    };
  }
}
