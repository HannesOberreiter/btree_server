import type { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';

import { KyselyServer } from '../../servers/kysely.server.js';
import type { MailLang } from '../../services/mail.service.js';
import { MailLangs } from '../../services/mail.service.js';
import { User } from '../models/user.model.js';
import type { CompatibilityQuery } from '../schemas/common.schema.js';
import type {
  GetWeatherDataParams,
  GetGruenlandtemperatursummeParams,
  PaypalCreateOrderBody,
  PaypalCapturePaymentParams,
  StripeCreateOrderBody,
  MollieCreateOrderBody,
} from '../schemas/service.schema.js';
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
  getElevation,
  getHistoricalTemperatures,
  getWeatherData,
} from '../utils/temperature.util.js';

export default class ServiceController {
  static async getElevation(req: FastifyRequest, _reply: FastifyReply) {
    const query = req.query as CompatibilityQuery;
    const latitude = Number(query.latitude);
    const longitude = Number(query.longitude);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw httpErrors.BadRequest('Invalid latitude');
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw httpErrors.BadRequest('Invalid longitude');
    }

    const elevation = await getElevation(latitude, longitude);
    return { latitude, longitude, elevation };
  }

  static async getWeatherData(req: FastifyRequest, _reply: FastifyReply) {
    const params = req.params as GetWeatherDataParams;
    const premium = await isPremium(req.session.user.user_id);
    if (!premium) {
      throw httpErrors.PaymentRequired();
    }
    const apiary = await KyselyServer.getInstance()
      .db.selectFrom('apiaries')
      .select(['latitude', 'longitude'])
      .where('id', '=', params.apiary_id)
      .where('user_id', '=', req.session.user.user_id)
      .executeTakeFirst();

    if (!apiary) {
      throw httpErrors.NotFound('Apiary not found');
    }
    const weatherData = await getWeatherData(
      Number(apiary.latitude),
      Number(apiary.longitude),
    );
    return weatherData;
  }

  static async getGruenlandtemperatursumme(
    req: FastifyRequest,
    _reply: FastifyReply,
  ) {
    const params = req.params as GetGruenlandtemperatursummeParams;
    const apiary = await KyselyServer.getInstance()
      .db.selectFrom('apiaries')
      .select(['id', 'name', 'latitude', 'longitude', 'elevation'])
      .where('id', '=', params.apiary_id)
      .where('user_id', '=', req.session.user.user_id)
      .where('deleted', '=', false)
      .executeTakeFirst();
    if (!apiary) throw httpErrors.NotFound();

    if (!apiary.latitude || !apiary.longitude) {
      throw httpErrors.BadRequest('Apiary coordinates not set');
    }

    const query = req.query as CompatibilityQuery;
    const year = query?.year ?? new Date().getFullYear();
    if (year > new Date().getFullYear()) {
      throw httpErrors.BadRequest('Year cannot be in the future');
    }

    const startDate = `${year}-01-01`; // Always get previous year from Jan 1st
    const endDate =
      year === new Date().getFullYear()
        ? new Date().toISOString().split('T')[0]
        : `${year}-06-31`;

    const dailyTemperatures = await getHistoricalTemperatures(
      Number(apiary.latitude),
      Number(apiary.longitude),
      startDate,
      endDate,
      apiary.elevation,
    );

    const gtsResult = calculateGruenlandtemperatursumme(dailyTemperatures);

    return {
      ...gtsResult,
      apiary: {
        id: apiary.id,
        name: apiary.name,
        latitude: Number(apiary.latitude),
        longitude: Number(apiary.longitude),
        elevation: apiary.elevation,
      },
    };
  }

  static async paypalCreateOrder(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as PaypalCreateOrderBody;
    const order = await paypalCreateOrder(
      req.session.user.user_id,
      req.session.user.bee_id,
      body.amount,
      body.quantity,
    );
    if (order.status !== 'CREATED') {
      throw new httpErrors.InternalServerError('Could not create order');
    }
    return order;
  }

  static async paypalCapturePayment(req: FastifyRequest, _reply: FastifyReply) {
    const params = req.params as PaypalCapturePaymentParams;
    const capture = await capturePayment(params.orderID);
    if (capture.status !== 'COMPLETED' && capture.status !== 'APPROVED') {
      throw new httpErrors.InternalServerError('Could not capure order');
    }
    let value = 0;
    let years = 1;
    let bee_id: number | null = null;

    try {
      value = Number.parseFloat(
        capture.purchase_units[0].payments.captures[0].amount.value,
      );
    } catch (error) {
      req.log.error(error);
    }

    try {
      const custom_id = JSON.parse(
        capture.purchase_units[0].payments.captures[0].custom_id,
      );
      years = Number.parseFloat(custom_id.quantity) ?? 1;
      if (custom_id.bee_id) bee_id = Number.parseInt(custom_id.bee_id, 10);
    } catch (error) {
      req.log.error(error);
    }

    const paid = await addPremium(
      req.session.user.user_id,
      12 * years,
      value,
      'paypal',
    );

    let mail: string | null = null;
    let lang: MailLang = 'en';
    if (!bee_id) {
      req.log.error({ capture }, 'PayPal capture missing bee_id in custom_id');
      return { ...capture, paid };
    }
    try {
      const user = await User.query().select('email', 'lang').findById(bee_id);
      if (user?.email) mail = user.email;
      if (user?.lang && MailLangs.includes(user.lang as MailLang))
        lang = user.lang as MailLang;
    } catch (error) {
      req.log.error(error);
    }

    if (mail) {
      void createInvoice(mail, value, years, 'PayPal', lang);
    }
    return { ...capture, paid };
  }

  static async stripeCreateOrder(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as StripeCreateOrderBody;
    const session = await stripeCreateOrder(
      req.session.user.user_id,
      req.session.user.bee_id,
      body.amount,
      body.quantity,
    );
    return session;
  }

  static async mollieCreateOrder(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as MollieCreateOrderBody;
    const order = await mollieCreateOrder(
      req.session.user.user_id,
      req.session.user.bee_id,
      body.amount,
      body.quantity,
    );
    if (!order || !order.id) {
      throw new httpErrors.InternalServerError('Could not create order');
    }
    if (
      !order._links ||
      !order._links.checkout ||
      !order._links.checkout.href
    ) {
      throw new httpErrors.InternalServerError('Could not create order');
    }
    return { url: order._links.checkout.href, id: order.id };
  }

  /**
   * @see https://geogis.ages.at/TKH_Zonenkarte
   */
  static async getAFBMapData(req: FastifyRequest, _reply: FastifyReply) {
    try {
      const res = await fetch(
        'https://geogis.ages.at/TKH_Zonenkarte/zonen.json',
        {
          headers: { 'User-Agent': 'btree/server (www.btree.at)' },
        },
      );
      const geojson = (await res.json()) as {
        features: Array<{
          properties: {
            id: string;
            tkh: string;
            tierart: string[];
            art: string;
            typ: string;
            beginn: string;
            area: number;
          };
          geometry: {
            type: string;
            coordinates: number[][][][];
          };
        }>;
      };

      // AGES Zonenkarte filter logic (from TKH_Zonenkarte.js):
      // - typ: 'R' = regulär (shown), 'T' = temporär (hidden on map)
      // - art: 'V' = Sperrzone, 'S' = Schutzzone, 'U' = Überwachungszone, 'K' = Kernzone, etc.
      // - Zones with future beginn date are excluded

      return geojson.features
        .filter(
          (f) =>
            f.properties.tierart.includes('BI') &&
            f.properties.tkh === 'AFB' &&
            f.properties.typ === 'R',
        )
        .map((f) => {
          const coords = f.geometry.coordinates[0][0];
          const xs = coords.map((c) => c[0]);
          const ys = coords.map((c) => c[1]);
          const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
          const cy = ys.reduce((a, b) => a + b, 0) / ys.length;

          // EPSG:3857 → WGS84
          const lng = (cx * 180) / 20037508.34;
          const lat =
            (Math.atan(Math.exp((cy * Math.PI) / 20037508.34)) * 360) /
              Math.PI -
            90;

          const radius = Math.sqrt(f.properties.area / Math.PI);

          const artLabels: Record<string, string> = {
            S: 'Schutzzone',
            V: 'Sperrzone',
            U: 'Überwachungszone',
          };

          const typLabel = artLabels[f.properties.art] || f.properties.art;
          const popup = `Amerikanische Faulbrut (AFB)\n${typLabel}\nID: ${f.properties.id}\nBeginn: ${f.properties.beginn}\nQuelle: AGES (geogis.ages.at)`;

          return {
            id: f.properties.id,
            gps: { lat, lng },
            radius: Math.round(radius),
            popup,
          };
        });
    } catch (error) {
      req.log.error(error);
      return [];
    }
  }
}
