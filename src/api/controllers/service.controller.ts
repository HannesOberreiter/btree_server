import type { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';
import { Apiary } from '../models/apiary.model.js';
import { createInvoice } from '../utils/foxyoffice.util.js';
import { createOrder as mollieCreateOrder } from '../utils/mollie.util.js';
import {
  capturePayment,
  createOrder as paypalCreateOrder,
} from '../utils/paypal.util.js';
import { addPremium, isPremium } from '../utils/premium.util.js';
import { createOrder as stripeCreateOrder } from '../utils/stripe.util.js';
import {
  calculateGruenlandtemperatursumme,
  getHistoricalTemperatures,
  getWeatherData,
} from '../utils/temperature.util.js';

export default class ServiceController {
  static async getWeatherData(req: FastifyRequest, _reply: FastifyReply) {
    const params = req.params as any;
    const premium = await isPremium(req.session.user.user_id);
    if (!premium) {
      throw httpErrors.PaymentRequired();
    }
    const apiary = await Apiary.query()
      .findById(params.apiary_id)
      .where({ user_id: req.session.user.user_id });
    const weatherData = await getWeatherData(apiary.latitude, apiary.longitude);
    return weatherData;
  }

  static async getGruenlandtemperatursumme(req: FastifyRequest, _reply: FastifyReply) {
    const params = req.params as any;
    const apiary = await Apiary.query()
      .findById(params.apiary_id)
      .where({
        user_id: req.session.user.user_id,
        deleted: false,
      })
      .throwIfNotFound();

    if (!apiary.latitude || !apiary.longitude) {
      throw httpErrors.BadRequest('Apiary coordinates not set');
    }

    const query = req.query as any;
    const year = query?.year ? Number(query.year) : new Date().getFullYear();
    if (year > new Date().getFullYear()) {
      throw httpErrors.BadRequest('Year cannot be in the future');
    }

    const startDate = `${year}-01-01`; // Always get previous year from Jan 1st
    const endDate = year === new Date().getFullYear()
      ? new Date().toISOString().split('T')[0]
      : `${year}-06-31`;

    const dailyTemperatures = await getHistoricalTemperatures(
      apiary.latitude,
      apiary.longitude,
      startDate,
      endDate,
    );

    const gtsResult = calculateGruenlandtemperatursumme(dailyTemperatures);

    return {
      ...gtsResult,
      apiary: {
        id: apiary.id,
        name: apiary.name,
        latitude: apiary.latitude,
        longitude: apiary.longitude,
      },
    };
  }

  static async paypalCreateOrder(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const order = await paypalCreateOrder(
      req.session.user.user_id,
      body.amount,
      body.quantity,
    );
    if (order.status !== 'CREATED') {
      throw new httpErrors.InternalServerError('Could not create order');
    }
    return order;
  }

  static async paypalCapturePayment(req: FastifyRequest, _reply: FastifyReply) {
    const params = req.params as any;
    const capture = await capturePayment(params.orderID);
    if (capture.status !== 'COMPLETED' && capture.status !== 'APPROVED') {
      throw new httpErrors.InternalServerError('Could not capure order');
    }
    let value = 0;
    let years = 1;

    const mail = capture.payment_source.paypal.email_address;

    try {
      value = Number.parseFloat(
        capture.purchase_units[0].payments.captures[0].amount.value,
      );
    }
    catch (e) {
      req.log.error(e);
    }

    try {
      const custom_id = JSON.parse(
        capture.purchase_units[0].payments.captures[0].custom_id,
      );
      years = Number.parseFloat(custom_id.quantity) ?? 1;
    }
    catch (e) {
      req.log.error(e);
    }

    const paid = await addPremium(
      req.session.user.user_id,
      12 * years,
      value,
      'paypal',
    );

    createInvoice(mail, value, years, 'PayPal');
    return { ...capture, paid };
  }

  static async stripeCreateOrder(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const session = await stripeCreateOrder(
      req.session.user.user_id,
      body.amount,
      body.quantity,
    );
    return session;
  }

  static async mollieCreateOrder(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const order = await mollieCreateOrder(
      req.session.user.user_id,
      req.session.user.bee_id,
      body.amount,
      body.quantity,
    );
    if (!order || !order.id) {
      throw new httpErrors.InternalServerError('Could not create order');
    }
    return { url: order._links.checkout.href, id: order.id };
  }

  /**
   * @see https://stmk.bienenwanderboerse.at
   */
  static async getAFBMapData(req: FastifyRequest, _reply: FastifyReply) {
    try {
      const proxy = 'https://stmk.bienenwanderboerse.at/api/v1/quarantine-areas';
      const res = await fetch(proxy, {
        method: 'POST',
        headers: {
          'User-Agent': 'btree/server (www.btree.at)',
        },
      }).then(res => res.json()) as {
        quarantine_areas: Array<{
          id: string
          gps: { lat: number, lng: number }
          radius: number
          popup: string
        }>
      };

      return res.quarantine_areas.map((area) => {
        const htmlContent = area.popup;

        // Remove HTML tags and normalize whitespace
        const textContent = htmlContent
          .replace(/<[^>]*>/g, '')
          .replace(/\r\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const diseaseMatch = textContent.match(/Amerikanische Faulbrut \(AFB\)/);
        const ordinanceMatch = textContent.match(/Verordnung:\s*(\S+)/);
        const districtMatch = textContent.match(/Bezirk: ([\s\S]+?)(?=Gemeinde:|$)/);
        const municipalityMatch = textContent.match(/Gemeinde: ([\s\S]+?)(?=Veterinärbehörde|$)/);
        const source = 'Quelle: bienenwanderboerse.at';

        return {
          id: area.id,
          gps: area.gps,
          radius: area.radius,
          popup: `${diseaseMatch ? diseaseMatch[0] : ''} \n${ordinanceMatch ? ordinanceMatch[1] : ''}\n${districtMatch ? districtMatch[1].trim() : ''} \n${municipalityMatch ? municipalityMatch[1].trim() : ''}\n${source}`,
        };
      });
    }
    catch (e) {
      req.log.error(e);
      return [];
    }
  }
}
