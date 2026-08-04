import { PaymentStatus } from '@mollie/api-client';
import dayjs from 'dayjs';
import type { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';
import ical, { ICalCalendarMethod } from 'ical-generator';

import { SOURCE } from '../../config/constants.config.js';
import { KyselyServer } from '../../servers/kysely.server.js';
import type { MailLang } from '../../services/mail.service.js';
import { MailLangs, MailService } from '../../services/mail.service.js';
import { createInvoice } from '../adapters/foxyoffice.adapter.js';
import { getPayment } from '../adapters/mollie.adapter.js';
import {
  listCalendarMovements,
  listCalendarRearings,
  listCalendarScaleData,
  listCalendarTasks,
  listCalendarTodos,
} from '../modules/calendar.module.js';
import { findCompanyByApiKey } from '../modules/company.module.js';
import { addPremium, isPremium } from '../modules/premium.module.js';
import type {
  ExternalCalendarParams,
  MollieWebhookBody,
} from '../schemas/external.schema.js';

export default class ExternalController {
  static async ical(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as ExternalCalendarParams;
    const company = await findCompanyByApiKey(
      KyselyServer.getInstance().db,
      params.api,
    );
    const premium = await isPremium(company.id, KyselyServer.getInstance().db);
    if (!premium) {
      throw httpErrors.PaymentRequired();
    }
    let results = [];
    const db = KyselyServer.getInstance().db;
    const payload = {
      user: {
        user_id: company.id,
      },
      params: {
        start: dayjs().subtract(6, 'month').toISOString(),
        end: dayjs().add(6, 'month').toISOString(),
      },
    };
    const calendar = ical({
      name: `b.tree - ${params.source}`,
      // timezone: 'UTC', // standard is UTC no need to define it
      prodId: {
        company: 'btree',
        product: 'events',
      },
    });
    calendar.method(ICalCalendarMethod.PUBLISH);
    switch (params.source) {
      case SOURCE.todo: {
        results = await listCalendarTodos(
          db,
          payload.user.user_id,
          payload.params,
        );
        break;
      }
      case SOURCE.rearing: {
        results = await listCalendarRearings(
          db,
          payload.user.user_id,
          payload.params,
        );
        break;
      }
      case SOURCE.movedate: {
        results = await listCalendarMovements(
          db,
          payload.user.user_id,
          payload.params,
        );
        break;
      }
      case SOURCE.scale_data: {
        results = await listCalendarScaleData(
          db,
          payload.user.user_id,
          payload.params,
        );
        break;
      }
      case SOURCE.checkup:
      case SOURCE.treatment:
      case SOURCE.harvest:
      case SOURCE.feed: {
        results = await listCalendarTasks(
          db,
          payload.user.user_id,
          payload.params,
          params.source,
        );
        break;
      }
      default: {
        throw httpErrors.BadRequest('Unsupported calendar source');
      }
    }
    for (const i in results) {
      const result = results[i];
      calendar.createEvent({
        id: `${result.table}_${i}`,
        start: result.start,
        end: result.end,
        allDay: result.allDay,
        summary: `${result.unicode ? `${result.unicode} ` : ''} ${
          result.title
        }`,
        description: result.description,
        // floating: true, // floating would mean always an event on 12:00 would be always on 12:00 no matter the timezone
        // timezone: 'UTC', // standard is UTC no need to define it
        url: 'https://app.btree.at/',
      });
    }
    const filename = `btree-${params.source}-${new Date().toISOString()}.ics`;
    reply.header('Content-Disposition', `attachment; filename=${filename}`);
    reply.header('Content-Type', 'text/calendar; charset=utf-8');
    return calendar.toString();
  }

  /**
   * @see https://docs.mollie.com/reference/webhooks
   */
  static async mollieWebhook(req: FastifyRequest, _reply: FastifyReply) {
    const event = req.body as MollieWebhookBody;
    if (!event || !event.id) {
      throw new httpErrors.BadRequest('Missing paymentId');
    }

    const payment = await getPayment(event.id);

    /* @see https://docs.mollie.com/docs/status-change */
    req.log.info(
      {
        paymentId: event.id,
        status: payment.status,
        payment: payment.statusReason
          ? payment.statusReason
          : 'No reason provided',
        meta: payment.metadata,
      },
      `Mollie Payment ${payment.status}`,
    );

    if (payment.status === PaymentStatus.failed) {
      // send mail to admin
      await MailService.getInstance().sendRawMail(
        'office@btree.at',
        'Failed Mollie Payment',
        `Payment ${payment.id} failed with status: ${payment.status} and reason: ${payment.statusReason?.message ?? 'No reason provided'}`,
      );
    } else if (payment.status === PaymentStatus.paid) {
      const reference = payment.metadata as {
        user_id: number;
        bee_id: number;
        quantity: number; // years
        server: string;
      };
      if (reference && reference.user_id) {
        const user_id = reference.user_id;
        const years = reference.quantity ?? 1;
        const price = Number.parseFloat(payment.amount.value);
        const premiumGrant = await addPremium(
          KyselyServer.getInstance().db,
          user_id,
          12 * years,
          price,
          'mollie',
          payment.id,
        );
        if (!premiumGrant.applied) return {};
        const bee_id = reference.bee_id;
        const user = await KyselyServer.getInstance()
          .db.selectFrom('bees')
          .select(['email', 'lang'])
          .where('id', '=', bee_id)
          .executeTakeFirst();
        let lang = 'en' as MailLang;
        if (user?.lang && MailLangs.includes(user.lang as MailLang)) {
          lang = user.lang as MailLang;
        }
        await createInvoice(user!.email, price, years, 'Mollie', lang);
      }
    }
    return {};
  }
}
