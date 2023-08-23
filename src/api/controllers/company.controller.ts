import { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';
import { randomBytes } from 'crypto';
import archiver from 'archiver';
import { stringify } from 'csv-stringify/sync';

import { Company } from '../models/company.model.js';
import { reviewPassword } from '../utils/login.util.js';
import { CompanyBee } from '../models/company_bee.model.js';
import { autoFill } from '../utils/autofill.util.js';
import { User } from '../models/user.model.js';
import UserController from '../controllers/user.controller.js';
import { deleteCompany } from '../utils/delete.util.js';
import { addPremium, isPremium } from '../utils/premium.util.js';
import { Apiary } from '../models/apiary.model.js';
import { Hive } from '../models/hive.model.js';
import { Movedate } from '../models/movedate.model.js';
import { Checkup } from '../models/checkup.model.js';
import { Feed } from '../models/feed.model.js';
import { Treatment } from '../models/treatment.model.js';
import { Harvest } from '../models/harvest.model.js';
import { Scale } from '../models/scale.model.js';
import { ScaleData } from '../models/scale_data.model.js';
import { Rearing } from '../models/rearing/rearing.model.js';
import { RearingType } from '../models/rearing/rearing_type.model.js';
import { Promo } from '../models/promos.model.js';
import { Counts } from '../models/counts.model.js';

export default class CompanyController {
  static async postCoupon(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const promo = await Promo.query()
      .select()
      .where({ code: body.coupon, used: false })
      .throwIfNotFound()
      .first();
    const paid = await addPremium(
      req.session.user.user_id,
      promo.months,
      0,
      'promo',
    );
    await Promo.query()
      .patch({
        used: true,
        date: new Date(),
        user_id: req.session.user.user_id,
      })
      .findById(promo.id);
    return { paid: paid };
  }

  static async download(req: FastifyRequest, reply: FastifyReply) {
    const stringifyOptions = {
      header: true,
      cast: {
        date: function (value) {
          return value.toISOString();
        },
      },
    };
    const arch = archiver('zip');
    await User.transaction(async (trx) => {
      const company = await Company.query(trx).findById(
        req.session.user.user_id,
      );
      arch.append(stringify([company], stringifyOptions), {
        name: 'company.csv',
      });
      const apiaries = await Apiary.query(trx).where(
        'user_id',
        req.session.user.user_id,
      );
      arch.append(stringify(apiaries, stringifyOptions), {
        name: 'apiaries.csv',
      });
      const hives = await Hive.query(trx).where(
        'user_id',
        req.session.user.user_id,
      );
      arch.append(stringify(hives, stringifyOptions), { name: 'hives.csv' });
      const movedates = await Movedate.query(trx)
        .withGraphJoined('apiary')
        .where('user_id', req.session.user.user_id);
      arch.append(stringify(movedates, stringifyOptions), {
        name: 'movedates.csv',
      });
      const checkups = await Checkup.query(trx)
        .withGraphJoined('type')
        .where('checkups.user_id', req.session.user.user_id);
      arch.append(stringify(checkups, stringifyOptions), {
        name: 'checkups.csv',
      });
      const feeds = await Feed.query(trx)
        .withGraphJoined('type')
        .where('feeds.user_id', req.session.user.user_id);
      arch.append(stringify(feeds, stringifyOptions), { name: 'feeds.csv' });
      const treatments = await Treatment.query(trx)
        .withGraphJoined('[type, disease, vet]')
        .where('treatments.user_id', req.session.user.user_id);
      arch.append(stringify(treatments, stringifyOptions), {
        name: 'treatments.csv',
      });
      const harvests = await Harvest.query(trx)
        .withGraphJoined('type')
        .where('harvests.user_id', req.session.user.user_id);
      arch.append(stringify(harvests, stringifyOptions), {
        name: 'harvests.csv',
      });
      const scales = await Scale.query(trx).where(
        'user_id',
        req.session.user.user_id,
      );
      arch.append(stringify(scales, stringifyOptions), {
        name: 'scales.csv',
      });
      const scale_data = await ScaleData.query(trx)
        .withGraphJoined('scale')
        .where('scale.user_id', req.session.user.user_id);
      arch.append(stringify(scale_data, stringifyOptions), {
        name: 'scale_data.csv',
      });
      const rearings = await Rearing.query(trx).where(
        'user_id',
        req.session.user.user_id,
      );
      arch.append(stringify(rearings, stringifyOptions), {
        name: 'rearings.csv',
      });
      const rearing_types = await RearingType.query(trx)
        .withGraphJoined('[detail, step]')
        .where('rearing_types.user_id', req.session.user.user_id);
      arch.append(stringify(rearing_types, stringifyOptions), {
        name: 'rearing_types.csv',
      });
    });

    // reply.header('Content-Type', 'application/zip');
    reply.header('Content-Type', 'application/octet-stream');
    reply.header(
      'Content-Disposition',
      'attachment; filename="btree_data.zip"',
    );
    arch.on('error', (err) => {
      throw err;
    });
    arch.pipe(reply.raw);
    arch.on('end', () => reply.raw.end()); // end response when archive stream ends
    return arch.finalize();
  }

  static async getApikey(req: FastifyRequest, reply: FastifyReply) {
    const premium = await isPremium(req.session.user.user_id);
    if (!premium) {
      throw httpErrors.PaymentRequired();
    }
    const result = await Company.query()
      .select('api_key')
      .findById(req.session.user.user_id);
    return { ...result };
  }

  static async getCounts(req: FastifyRequest, reply: FastifyReply) {
    const result = await Counts.query().where(
      'user_id',
      req.session.user.user_id,
    );
    return result;
  }
  static async delete(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    const otherUser = await Company.query()
      .select('user.id')
      .withGraphJoined('user')
      .whereNot({
        'user.id': req.session.user.bee_id,
      })
      .where({
        'companies.id': params.id,
      });
    if (otherUser.length > 0) {
      reply.send(
        httpErrors.Forbidden('Other user(s) found, please remove them first.'),
      );
      return;
    }

    const otherCompanies = await Company.query()
      .select('companies.id as id')
      .withGraphJoined('user')
      .where({
        'user.id': req.session.user.bee_id,
      })
      .whereNot({
        'companies.id': params.id,
      });
    if (otherCompanies.length === 0) {
      reply.send(
        httpErrors.Forbidden(
          'This is your last company, you cannot delete it.',
        ),
      );
      return;
    }

    req.body['saved_company'] = otherCompanies[0].id;

    await deleteCompany(parseInt(params.id));

    return await UserController.changeCompany(req, reply);
  }

  static async post(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as { name: string };
    const result = await Company.transaction(async (trx) => {
      const check = await Company.query(trx)
        .select('companies.id')
        .withGraphJoined('user')
        .where({
          name: body.name,
          'user.id': req.session.user.bee_id,
        });
      if (check.length > 0) {
        throw httpErrors.Conflict('Company name already exists');
      }
      const c = await Company.query(trx).insert({ name: body.name });
      const u = await User.query(trx)
        .select('lang')
        .findById(req.session.user.bee_id);
      await CompanyBee.query(trx).insert({
        bee_id: req.session.user.bee_id,
        user_id: c.id,
      });
      await autoFill(trx, c.id, u.lang);
      return c;
    });
    return { ...result };
  }

  static async patch(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as {
      name: string;
      password?: string;
      api_change?: boolean;
    };
    if ('password' in body) {
      await reviewPassword(req.session.user.bee_id, body.password);
      delete body.password;
    }
    const result = await Company.transaction(async (trx) => {
      const company = await Company.query(trx).findById(
        req.session.user.user_id,
      );
      let api_change = false;
      if ('api_change' in body) {
        const premium = await isPremium(req.session.user.user_id);
        if (!premium) {
          throw httpErrors.PaymentRequired();
        }
        api_change = body.api_change ? true : false;
        delete body.api_change;
      }

      const res = await company.$query().patchAndFetch({ ...body });

      if (
        api_change ||
        (res.api_active && (res.api_key === '' || res.api_key === null))
      ) {
        const apiKey = await randomBytes(25).toString('hex');
        await company.$query().patch({
          api_key: apiKey,
        });
      }
      delete res.api_key;
      return res;
    });
    return { ...result };
  }
}
