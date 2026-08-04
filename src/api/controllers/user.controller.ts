import { randomUUID } from 'node:crypto';

import type { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';

import { KyselyServer } from '../../servers/kysely.server.js';
import { RedisServer } from '../../servers/redis.server.js';
import { MailService } from '../../services/mail.service.js';
import {
  deleteCompany,
  deleteUser,
} from '../modules/account_deletion.module.js';
import {
  buildUserAgent,
  createHashedPassword,
} from '../modules/auth.module.js';
import {
  fetchUser,
  getPaidRank,
  reviewPassword,
} from '../modules/login.module.js';
import type {
  PatchBody,
  DeleteBody,
  CheckPasswordBody,
  ChangeCompanyBody,
  DeleteFederatedCredentialsParams,
  AddFederatedCredentialsBody,
  DeleteRedisSessionParams,
} from '../schemas/user.schema.js';

export default class UserController {
  static async getFederatedCredentials(
    req: FastifyRequest,
    _reply: FastifyReply,
  ) {
    return KyselyServer.getInstance()
      .db.selectFrom('federated_credentials')
      .selectAll()
      .where('bee_id', '=', req.session.user.bee_id)
      .execute();
  }

  static async deleteFederatedCredentials(
    req: FastifyRequest,
    _reply: FastifyReply,
  ) {
    const params = req.params as DeleteFederatedCredentialsParams;
    if (!params.id) {
      throw httpErrors.BadRequest('Missing id');
    }
    const result = await KyselyServer.getInstance()
      .db.deleteFrom('federated_credentials')
      .where('bee_id', '=', req.session.user.bee_id)
      .where('id', '=', params.id)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  static async addFederatedCredentials(
    req: FastifyRequest,
    _reply: FastifyReply,
  ) {
    const body = req.body as AddFederatedCredentialsBody;
    if (!body.email) {
      throw httpErrors.BadRequest('Missing mail');
    }
    const db = KyselyServer.getInstance().db;
    const insert = await db
      .insertInto('federated_credentials')
      .values({
        bee_id: req.session.user.bee_id,
        provider: body.provider,
        mail: body.email,
      })
      .executeTakeFirstOrThrow();
    const data = await db
      .selectFrom('federated_credentials')
      .selectAll()
      .where('id', '=', Number(insert.insertId))
      .executeTakeFirstOrThrow();
    return { data };
  }

  static async get(req: FastifyRequest, _reply: FastifyReply) {
    const db = KyselyServer.getInstance().db;
    const data = await fetchUser(db, '', req.session.user.bee_id);

    // Check if connected company exists (last visited company)
    // otherwise take the simply the first one
    let company: number;
    if (data.company.some((el) => el.id === data.saved_company)) {
      company = data.saved_company;
    } else {
      company = data.company[0].id;
    }
    const { rank, paid } = await getPaidRank(db, data.id, company);

    (req as FastifyRequest & { bee_id: number }).bee_id =
      req.session.user.bee_id;

    await req.session.regenerate();
    req.session.user = {
      bee_id: data.id,
      user_id: company,
      paid,
      rank: rank as typeof req.session.user.rank,
      user_agent: buildUserAgent(req),
      last_visit: new Date(),
      uuid: randomUUID(),
      ip: req.ip,
    };

    await req.session.save();

    return { ...data };
  }

  static async delete(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as DeleteBody;
    const db = KyselyServer.getInstance().db;
    await reviewPassword(db, req.session.user.bee_id, body.password);
    const companies = await db
      .selectFrom('company_bee')
      .select('user_id')
      .where('bee_id', '=', req.session.user.bee_id)
      .execute();
    for (const company of companies) {
      if (!company.user_id) continue;
      const count = await db
        .selectFrom('company_bee')
        .select(db.fn.countAll<number>().as('count'))
        .where('user_id', '=', company.user_id)
        .executeTakeFirstOrThrow();
      if (count.count === 1) await deleteCompany(db, company.user_id);
    }

    const result = await deleteUser(db, req.session.user.bee_id);
    return result;
  }

  static async checkPassword(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as CheckPasswordBody;
    if ('password' in body) {
      const result = await reviewPassword(
        KyselyServer.getInstance().db,
        req.session.user.bee_id,
        body.password,
      );
      return result;
    }
    return {};
  }

  static async patch(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as PatchBody;
    const db = KyselyServer.getInstance().db;
    let credentials: ReturnType<typeof createHashedPassword> | undefined;
    if (body.password !== undefined) {
      await reviewPassword(db, req.session.user.bee_id, body.password);
      if (body.newPassword)
        credentials = createHashedPassword(body.newPassword);
    }

    await db
      .updateTable('bees')
      .set({
        ...(body.email && { email: body.email }),
        ...(body.username !== undefined && { username: body.username }),
        ...(body.lang !== undefined && { lang: body.lang }),
        ...(body.format !== undefined && { format: body.format }),
        ...(body.saved_company !== undefined && {
          saved_company: body.saved_company,
        }),
        ...(body.sound !== undefined && { sound: body.sound }),
        ...(body.todo !== undefined && { todo: body.todo }),
        ...(body.acdate !== undefined && { acdate: body.acdate }),
        ...(body.newsletter !== undefined && { newsletter: body.newsletter }),
        ...(credentials && {
          password: credentials.password,
          salt: credentials.salt,
        }),
      })
      .where('id', '=', req.session.user.bee_id)
      .execute();

    const user = await fetchUser(db, '', req.session.user.bee_id);
    if (!user) throw httpErrors.NotFound();
    if (credentials) {
      await MailService.getInstance().sendMail({
        to: user.email,
        lang: user.lang,
        subject: 'pw_reseted',
        name: user.username,
      });
    }
    return user;
  }

  static async changeCompany(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as ChangeCompanyBody;
    const db = KyselyServer.getInstance().db;
    const result = await db.transaction().execute(async (trx) => {
      const relation = await trx
        .selectFrom('company_bee')
        .select('id')
        .where('bee_id', '=', req.session.user.bee_id)
        .where('user_id', '=', body.saved_company)
        .executeTakeFirst();
      if (!relation) throw httpErrors.NotFound();
      const update = await trx
        .updateTable('bees')
        .set({ saved_company: body.saved_company })
        .where('id', '=', req.session.user.bee_id)
        .executeTakeFirst();
      return Number(update.numUpdatedRows);
    });

    const data = await fetchUser(db, '', req.session.user.bee_id);
    if (!data) throw httpErrors.NotFound();
    const { rank, paid } = await getPaidRank(db, data.id, body.saved_company);

    (req as FastifyRequest & { bee_id: number }).bee_id =
      req.session.user.bee_id;
    await req.session.regenerate();
    req.session.user = {
      bee_id: data.id,
      user_id: body.saved_company,
      paid,
      rank: rank as typeof req.session.user.rank,
      user_agent: buildUserAgent(req),
      last_visit: new Date(),
      uuid: randomUUID(),
      ip: req.ip,
    };
    await req.session.save();
    return { data, result };
  }

  static async getRedisSession(req: FastifyRequest, _reply: FastifyReply) {
    const { bee_id } = req.session.user;
    let keys: string[] = [];
    let cursor = '0';
    let safety = 1000;

    while (safety-- > 0) {
      const result = await RedisServer.client.scan(cursor, {
        MATCH: `btree_sess:${bee_id}:*`,
        COUNT: 500,
      });
      if (result.keys.length > 0) {
        keys.push(
          ...result.keys.map((key) =>
            typeof key === 'string' ? key : key.toString(),
          ),
        );
      }
      cursor =
        typeof result.cursor === 'string'
          ? result.cursor
          : result.cursor.toString();
      if (cursor === '0') break;
    }

    if (keys.length === 0) {
      return [];
    }
    const content = await RedisServer.client.mGet(keys);
    const result = content
      .map((el, index) => {
        if (!el) {
          return null;
        }
        const sessionJson = typeof el === 'string' ? el : el.toString();
        const o = JSON.parse(sessionJson);
        if (!o.user) return null;
        o.id = keys[index];
        o.user.currentSession =
          o.user?.uuid && o.user?.uuid === req.session.user.uuid;
        return o;
      })
      .filter((el) => el !== null);
    return result;
  }

  static async deleteRedisSession(req: FastifyRequest, _reply: FastifyReply) {
    const { bee_id } = req.session.user;
    const { id } = req.params as DeleteRedisSessionParams;
    const lastPart = id.split(':').at(-1);
    const result = await RedisServer.client.del(
      `btree_sess:${bee_id}:${lastPart}`,
    );
    return result;
  }
}
