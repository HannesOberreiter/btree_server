import { Response, NextFunction } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { Company } from '@models/company.model';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { randomBytes } from 'crypto';
import { reviewPassword } from '@utils/login.util';
import { CompanyBee } from '@models/company_bee.model';
import { autoFill } from '@utils/autofill.util';
import { User } from '@models/user.model';
import { Boom, forbidden, paymentRequired } from '@hapi/boom';
import { UserController } from '@controllers/user.controller';
import { deleteCompany } from '../utils/delete.util';
import { addPremium, isPremium } from '../utils/premium.util';
import archiver from 'archiver'
import {stringify} from 'csv-stringify/sync';
import { Apiary } from '../models/apiary.model';
import { Hive } from '../models/hive.model';
import { Movedate } from '../models/movedate.model';
import { Checkup } from '../models/checkup.model';
import { Feed } from '../models/feed.model';
import { Treatment } from '../models/treatment.model';
import { Harvest } from '../models/harvest.model';
import { Scale } from '../models/scale.model';
import { ScaleData } from '../models/scale_data.model';
import { Rearing } from '../models/rearing/rearing.model';
import { RearingType } from '../models/rearing/rearing_type.model';
import { Promo } from '../models/promos.model';
import dayjs from 'dayjs';

export class CompanyController extends Controller {
  constructor() {
    super();
  }

  async postCoupon(req: IUserRequest, res: Response, next: NextFunction){
    try {
      const promo = await Promo.query().select().where({'code': req.body.coupon, used: false}).throwIfNotFound().first();
      const paid = await addPremium(req.user.user_id, promo.months);
      await Promo.query().patch({
        'used': true,
        'date': new Date(),
        'user_id': req.user.user_id
      }).findById(promo.id)
      res.locals.data = {paid: paid}
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async download(req: IUserRequest, res: Response, next: NextFunction) {
    const stringifyOptions = {
      header: true,
      cast: {
        date: function(value) {
          return value.toISOString();
        }
      }
    }
    try {
      const arch = archiver('zip');
      await User.transaction(async (trx) => {
        const company  = await Company.query(trx).findById(req.user.user_id);
        arch.append(stringify([company], stringifyOptions), { name: 'company.csv'});
        const apiaries  = await Apiary.query(trx).where('user_id', req.user.user_id);
        arch.append(stringify(apiaries, stringifyOptions), { name: 'apiaries.csv'});
        const hives  = await Hive.query(trx).where('user_id', req.user.user_id);
        arch.append(stringify(hives, stringifyOptions), { name: 'hives.csv'});
        const movedates  = await Movedate.query(trx).withGraphJoined('apiary').where('user_id', req.user.user_id);
        arch.append(stringify(movedates, stringifyOptions), { name: 'movedates.csv'});
        const checkups  = await Checkup.query(trx).withGraphJoined('type').where('checkups.user_id', req.user.user_id);
        arch.append(stringify(checkups, stringifyOptions), { name: 'checkups.csv'});
        const feeds  = await Feed.query(trx).withGraphJoined('type').where('feeds.user_id', req.user.user_id);
        arch.append(stringify(feeds, stringifyOptions), { name: 'feeds.csv'});
        const treatments  = await Treatment.query(trx).withGraphJoined('[type, disease, vet]').where('treatments.user_id', req.user.user_id);
        arch.append(stringify(treatments, stringifyOptions), { name: 'treatments.csv'});
        const harvests  = await Harvest.query(trx).withGraphJoined('type').where('harvests.user_id', req.user.user_id);
        arch.append(stringify(harvests, stringifyOptions), { name: 'harvests.csv'});
        const scales  = await Scale.query(trx).where('user_id', req.user.user_id);
        arch.append(stringify(scales, stringifyOptions), { name: 'scales.csv'});
        const scale_data  = await ScaleData.query(trx).withGraphJoined('scale').where('scale.user_id', req.user.user_id);
        arch.append(stringify(scale_data, stringifyOptions), { name: 'scale_data.csv'});
        const rearings  = await Rearing.query(trx).where('user_id', req.user.user_id);
        arch.append(stringify(rearings, stringifyOptions), { name: 'rearings.csv'});
        const rearing_types  = await RearingType.query(trx).withGraphJoined('[detail, step]').where('rearing_types.user_id', req.user.user_id);
        arch.append(stringify(rearing_types, stringifyOptions), { name: 'rearing_types.csv'});
      });
      res.attachment('test.zip').type('zip');
      arch.on('end', () => res.end()); // end response when archive stream ends
      arch.pipe(res);
      arch.finalize();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async getApikey(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const premium = await isPremium(req.user.user_id)
      if (!premium) throw paymentRequired();
      const result = await Company.query()
        .select('api_key')
        .findById(req.user.user_id);
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async delete(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const otherUser = await Company.query()
        .select('user.id')
        .withGraphJoined('user')
        .whereNot({
          'user.id': req.user.bee_id,
        })
        .where({
          'companies.id': req.params.id,
        });
      if (otherUser.length > 0)
        throw forbidden('Other user(s) found, please remove them first.');

      const otherCompanies = await Company.query()
        .select('companies.id as id')
        .withGraphJoined('user')
        .where({
          'user.id': req.user.bee_id,
        })
        .whereNot({
          'companies.id': req.params.id,
        });
      if (otherCompanies.length === 0)
        throw forbidden('This is your last company, you cannot delete it.');
      req.body.saved_company = otherCompanies[0].id;

      await deleteCompany(parseInt(req.params.id));

      const user = new UserController();
      user.changeCompany(req, res, next);
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async post(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Company.transaction(async (trx) => {
        const check = await Company.query(trx)
          .select('companies.id')
          .withGraphJoined('user')
          .where({
            name: req.body.name,
            'user.id': req.user.bee_id,
          });
        if (check.length > 0)
          throw new Boom('Company name already exists', {
            statusCode: 409,
          });
        const c = await Company.query(trx).insert({ name: req.body.name });
        const u = await User.query(trx)
          .select('lang')
          .findById(req.user.bee_id);
        await CompanyBee.query(trx).insert({
          bee_id: req.user.bee_id,
          user_id: c.id,
        });
        await autoFill(trx, c.id, u.lang);
        return c;
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async patch(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      if ('password' in req.body) {
        await reviewPassword(req.user.bee_id, req.body.password);
        delete req.body.password;
      }
      const result = await Company.transaction(async (trx) => {
        const company = await Company.query(trx).findById(req.user.user_id);
        let api_change = false;
        if ('api_change' in req.body) {
          const premium = await isPremium(req.user.user_id)
          if (!premium) throw paymentRequired();
          api_change = req.body.api_change ? true : false;
          delete req.body.api_change;
        }

        const res = await company.$query().patchAndFetch({ ...req.body });

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
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
