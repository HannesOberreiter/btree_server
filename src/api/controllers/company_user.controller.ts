import { checkMySQLError } from '@utils/error.util';
import { CompanyBee } from '@models/company_bee.model';
import { Company } from '@models/company.model';

import UserController from './user.controller';
import AuthController from './auth.controller';

import { User } from '../models/user.model';
import { randomBytes } from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';

export default class CompanyUserController {
  static async patch(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const result = await CompanyBee.query()
      .patch({ rank: body.rank })
      .where({
        bee_id: (req.params as any).id,
        user_id: req.session.user.user_id,
      });
    return result;
  }

  static async getUser(req: FastifyRequest, reply: FastifyReply) {
    const result = await CompanyBee.query()
      .withGraphJoined('[user, company]')
      .where({ user_id: req.session.user.user_id });
    return result;
  }

  static async addUser(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const userExists = await User.query()
      .select('id')
      .findOne({ email: body.email });
    if (userExists) {
      const duplicate = await CompanyBee.query().select('id').findOne({
        bee_id: userExists.id,
        user_id: req.session.user.user_id,
      });
      if (duplicate) {
        return { userExists };
      } else {
        await CompanyBee.query().insert({
          bee_id: userExists.id,
          user_id: req.session.user.user_id,
          rank: 3,
        });
        return { userExists };
      }
    } else {
      const inviter = await User.query()
        .select('lang')
        .findById(req.session.user.bee_id);
      const newUser = await User.query().insertAndFetch({
        email: body.email,
        lang: inviter.lang,
        password: randomBytes(40).toString('hex'),
        salt: randomBytes(40).toString('hex'),
        last_visit: new Date('1989-01-05'),
      });
      await CompanyBee.query().insert({
        bee_id: newUser.id,
        user_id: req.session.user.user_id,
        rank: 3,
      });

      const result = await AuthController.resetRequest(req, reply);
      return { ...result };
    }
  }

  static async removeUser(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as any;
    const result = await CompanyBee.query()
      .delete()
      .where({ bee_id: params.id, user_id: req.session.user.user_id });
    return result;
  }

  static async delete(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as any;
    const otherUser = await Company.query()
      .select('user.id')
      .withGraphJoined('user')
      .whereNot({
        'user.id': req.session.user.bee_id,
      })
      .where({
        'companies.id': params.company_id,
      });
    if (otherUser.length === 0) {
      throw httpErrors.Forbidden(
        'No other users found, cannot remove your access.',
      );
    }

    const otherCompanies = await Company.query()
      .select('companies.id as id')
      .withGraphJoined('user')
      .where({
        'user.id': req.session.user.bee_id,
      })
      .whereNot({
        'companies.id': params.company_id,
      });

    if (otherCompanies.length === 0) {
      reply.send(
        httpErrors.Forbidden(
          'This is your last company, you cannot remove access to it.',
        ),
      );
      return;
    }

    req.body['saved_company'] = otherCompanies[0].id;

    await CompanyBee.query()
      .delete()
      .where({ user_id: params.company_id, bee_id: req.session.user.bee_id });

    return await UserController.changeCompany(req, reply);
  }
}
