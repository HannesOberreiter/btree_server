import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import httpErrors from 'http-errors';
import { map } from 'lodash-es';

import { RedisServer } from '../../servers/redis.server.js';
import { MailService } from '../../services/mail.service.js';
import { CompanyBee } from '../models/company_bee.model.js';
import { FederatedCredential } from '../models/federated_credential.js';
import { User } from '../models/user.model.js';
import { buildUserAgent, createHashedPassword } from '../utils/auth.util.js';
import { deleteCompany, deleteUser } from '../utils/delete.util.js';
import { checkMySQLError } from '../utils/error.util.js';
import { fetchUser, getPaidRank, reviewPassword } from '../utils/login.util.js';

export default class UserController {
  static async getFederatedCredentials(
    req: FastifyRequest,
    _reply: FastifyReply,
  ) {
    const data = await FederatedCredential.query().where({
      bee_id: req.session.user.bee_id,
    });
    return data;
  }

  static async deleteFederatedCredentials(
    req: FastifyRequest,
    _reply: FastifyReply,
  ) {
    const params = req.params as any;
    if (!params.id) {
      throw httpErrors.BadRequest('Missing id');
    }
    const data = await FederatedCredential.query().delete().where({
      bee_id: req.session.user.bee_id,
      id: params.id,
    });
    return data;
  }

  static async addFederatedCredentials(
    req: FastifyRequest,
    _reply: FastifyReply,
  ) {
    const body = req.body as any;
    if (!body.email) {
      throw httpErrors.BadRequest('Missing mail');
    }
    const data = await FederatedCredential.query().insert({
      bee_id: req.session.user.bee_id,
      provider: 'google',
      mail: body.email,
    });
    return { data };
  }

  static async get(req: FastifyRequest, _reply: FastifyReply) {
    const data = await fetchUser('', req.session.user.bee_id);

    // Check if connected company exists (last visited company)
    // otherwise take the simply the first one
    let company: number;
    if (data.company.some(el => el.id === data.saved_company)) {
      company = data.saved_company;
    }
    else {
      company = data.company[0].id;
    }
    const { rank, paid } = await getPaidRank(data.id, company);

    (req as any).bee_id = req.session.user.bee_id;

    await req.session.regenerate();
    req.session.user = {
      bee_id: data.id,
      user_id: company,
      paid,
      rank: rank as any,
      user_agent: buildUserAgent(req),
      last_visit: new Date(),
      uuid: randomUUID(),
      ip: req.ip,
    };

    await req.session.save();

    return { ...data };
  }

  static async delete(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    await reviewPassword(req.session.user.bee_id, body.password);
    const companies = await CompanyBee.query().where({
      bee_id: req.session.user.bee_id,
    });
    await Promise.all(
      map(companies, async (company) => {
        const count = await CompanyBee.query().select('id').where({
          user_id: company.user_id,
        });
        if (count.length === 1 && company.user_id) {
          await deleteCompany(company.user_id);
        }
        return true;
      }),
    );

    const result = await deleteUser(req.session.user.bee_id);
    return result;
  }

  static async checkPassword(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    if ('password' in body) {
      const result = await reviewPassword(
        req.session.user.bee_id,
        body.password,
      );
      return result;
    }
    return {};
  }

  static async patch(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const trx = await User.startTransaction();
    try {
      if ('password' in body) {
        try {
          await reviewPassword(req.session.user.bee_id, body.password, trx);
        }
        catch (e) {
          throw checkMySQLError(e);
        }

        delete body.password;
        if ('email' in body) {
          if (body.email === '')
            delete body.email;
        }
        if ('newPassword' in body) {
          if (body.newPassword === '') {
            delete body.newPassword;
          }
          else {
            const password = createHashedPassword(body.newPassword);
            delete body.newPassword;
            body.password = password.password;
            body.salt = password.salt;
          }
        }
      }

      await User.query(trx).findById(req.session.user.bee_id).patch(req.body);

      await trx.commit();
      const user = await fetchUser('', req.session.user.bee_id);
      if ('salt' in body) {
        try {
          await MailService.getInstance().sendMail({
            to: user.email,
            lang: user.lang,
            subject: 'pw_reseted',
            name: user.username,
          });
        }
        catch (e) {
          throw checkMySQLError(e);
        }
      }
      return user;
    }
    catch (e) {
      await trx.rollback();
      throw e;
    }
  }

  static async changeCompany(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const trx = await User.startTransaction();
    try {
      await CompanyBee.query(trx)
        .where('bee_id', req.session.user.bee_id)
        .where('user_id', body.saved_company)
        .throwIfNotFound();

      const result = await User.query(trx)
        .findById(req.session.user.bee_id)
        .patch({
          saved_company: body.saved_company,
        });
      await trx.commit();

      const data = await fetchUser('', req.session.user.bee_id);

      const { rank, paid } = await getPaidRank(data.id, body.saved_company);

      (req as any).bee_id = req.session.user.bee_id;
      await req.session.regenerate();
      req.session.user = {
        bee_id: data.id,
        user_id: body.saved_company,
        paid,
        rank: rank as any,
        user_agent: buildUserAgent(req),
        last_visit: new Date(),
        uuid: randomUUID(),
        ip: req.ip,
      };
      await req.session.save();

      return { data, result };

      // const userAgent = buildUserAgent(req);
      /* const token = await generateTokenResponse(
        req.session.user.bee_id,
        req.body.saved_company,
        userAgent
      ); */
    }
    catch (e) {
      await trx.rollback();
      throw e;
    }
  }

  static async getRedisSession(req: FastifyRequest, _reply: FastifyReply) {
    const { bee_id } = req.session.user;
    let keys = [];
    let cursor = 0;
    let safety = 1000;

    while (safety-- > 0) {
      const result = await RedisServer.client.scan(
        cursor,
        'MATCH',
        `btree_sess:${bee_id}:*`,
        'COUNT',
        500,
      );
      if (result[1].length > 0) {
        keys = keys.concat(result[1]);
      }
      const nextCursor = Number.parseInt(result[0]);
      if (nextCursor === 0)
        break;
      cursor = nextCursor;
    }

    if (keys.length === 0) {
      return [];
    }
    const content = await RedisServer.client.mget(keys);
    const result = content
      .map((el, index) => {
        const o = JSON.parse(el);
        if (!o.user)
          return null;
        o.id = keys[index];
        o.user.currentSession
          = o.user?.uuid && o.user?.uuid === req.session.user.uuid;
        return o;
      })
      .filter(el => el !== null);
    return result;
  }

  static async deleteRedisSession(req: FastifyRequest, _reply: FastifyReply) {
    const { bee_id } = req.session.user;
    const { id } = req.params as any;
    const lastPart = id.split(':').at(-1);
    const result = await RedisServer.client.del(
      `btree_sess:${bee_id}:${lastPart}`,
    );
    return result;
  }
}
