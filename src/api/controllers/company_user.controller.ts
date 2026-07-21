import { randomBytes } from 'node:crypto';

import type { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';
import { sql } from 'kysely';

import { KyselyServer } from '../../servers/kysely.server.js';
import type {
  CompanyUserAddBody,
  CompanyUserCompanyParams,
  CompanyUserIdParams,
  CompanyUserRankBody,
} from '../schemas/company_user.schema.js';
import type { ChangeCompanyBody } from '../schemas/user.schema.js';
import AuthController from './auth.controller.js';
import UserController from './user.controller.js';

export default class CompanyUserController {
  static async patch(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as CompanyUserRankBody;
    const params = req.params as CompanyUserIdParams;
    const result = await KyselyServer.getInstance()
      .db.updateTable('company_bee')
      .set({ rank: body.rank })
      .where('bee_id', '=', params.id)
      .where('user_id', '=', req.session.user.user_id)
      .executeTakeFirst();
    return Number(result.numUpdatedRows);
  }

  static async getUser(req: FastifyRequest, _reply: FastifyReply) {
    return KyselyServer.getInstance()
      .db.selectFrom('company_bee')
      .innerJoin('bees', 'bees.id', 'company_bee.bee_id')
      .innerJoin('companies', 'companies.id', 'company_bee.user_id')
      .selectAll('company_bee')
      .select([
        sql<{
          id: number;
          email: string | null;
          username: string | null;
          last_visit: Date | null;
        }>`JSON_OBJECT('id', bees.id, 'email', bees.email, 'username', bees.username, 'last_visit', bees.last_visit)`.as(
          'user',
        ),
        sql<{
          id: number;
          name: string | null;
          paid: Date | null;
          api_active: boolean | null;
        }>`JSON_OBJECT('id', companies.id, 'name', companies.name, 'paid', companies.paid, 'api_active', IF(companies.api_active = 1, TRUE, FALSE))`.as(
          'company',
        ),
      ])
      .where('company_bee.user_id', '=', req.session.user.user_id)
      .execute();
  }

  static async addUser(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as CompanyUserAddBody;
    const db = KyselyServer.getInstance().db;
    const userExists = await db
      .selectFrom('bees')
      .select('id')
      .where('email', '=', body.email)
      .executeTakeFirst();
    if (userExists) {
      const duplicate = await db
        .selectFrom('company_bee')
        .select('id')
        .where('bee_id', '=', userExists.id)
        .where('user_id', '=', req.session.user.user_id)
        .executeTakeFirst();
      if (!duplicate) {
        await db
          .insertInto('company_bee')
          .values({
            bee_id: userExists.id,
            user_id: req.session.user.user_id,
            rank: 3,
          })
          .execute();
      }
      return { userExists };
    }

    await db.transaction().execute(async (trx) => {
      const inviter = await trx
        .selectFrom('bees')
        .select('lang')
        .where('id', '=', req.session.user.bee_id)
        .executeTakeFirstOrThrow();
      const insert = await trx
        .insertInto('bees')
        .values({
          email: body.email,
          lang: inviter.lang,
          password: randomBytes(40).toString('hex'),
          salt: randomBytes(40).toString('hex'),
          last_visit: new Date('1989-01-05'),
        })
        .executeTakeFirstOrThrow();
      await trx
        .insertInto('company_bee')
        .values({
          bee_id: Number(insert.insertId),
          user_id: req.session.user.user_id,
          rank: 3,
        })
        .execute();
    });
    return { ...(await AuthController.resetRequest(req, reply)) };
  }

  static async removeUser(req: FastifyRequest, _reply: FastifyReply) {
    const params = req.params as CompanyUserIdParams;
    const result = await KyselyServer.getInstance()
      .db.deleteFrom('company_bee')
      .where('bee_id', '=', params.id)
      .where('user_id', '=', req.session.user.user_id)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  static async delete(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as CompanyUserCompanyParams;
    const db = KyselyServer.getInstance().db;
    const otherUser = await db
      .selectFrom('company_bee')
      .select('bee_id')
      .where('user_id', '=', params.company_id)
      .where('bee_id', '!=', req.session.user.bee_id)
      .executeTakeFirst();
    if (!otherUser) {
      throw httpErrors.Forbidden(
        'No other users found, cannot remove your access.',
      );
    }

    const otherCompany = await db
      .selectFrom('company_bee')
      .select('user_id')
      .where('bee_id', '=', req.session.user.bee_id)
      .where('user_id', '!=', params.company_id)
      .executeTakeFirst();
    if (!otherCompany?.user_id) {
      reply.send(
        httpErrors.Forbidden(
          'This is your last company, you cannot remove access to it.',
        ),
      );
      return;
    }

    await db
      .deleteFrom('company_bee')
      .where('user_id', '=', params.company_id)
      .where('bee_id', '=', req.session.user.bee_id)
      .execute();
    (req as FastifyRequest & { body: ChangeCompanyBody }).body = {
      saved_company: otherCompany.user_id,
    };
    return UserController.changeCompany(req, reply);
  }
}
