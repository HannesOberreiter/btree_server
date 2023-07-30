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
    try {
      const body = req.body as any;
      const result = await CompanyBee.query()
        .patch({ rank: body.rank })
        .where({ bee_id: (req.params as any).id, user_id: req.user.user_id });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async getUser(req: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await CompanyBee.query()
        .withGraphJoined('[user, company]')
        .where({ user_id: req.user.user_id });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async addUser(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const userExists = await User.query()
        .select('id')
        .findOne({ email: body.email });
      if (userExists) {
        const duplicate = await CompanyBee.query()
          .select('id')
          .findOne({ bee_id: userExists.id, user_id: req.user.user_id });
        if (duplicate) {
          reply.send(userExists);
        } else {
          await CompanyBee.query().insert({
            bee_id: userExists.id,
            user_id: req.user.user_id,
            rank: 3,
          });
          reply.send(userExists);
        }
      } else {
        const inviter = await User.query()
          .select('lang')
          .findById(req.user.bee_id);
        const newUser = await User.query().insertAndFetch({
          email: body.email,
          lang: inviter.lang,
          password: randomBytes(40).toString('hex'),
          salt: randomBytes(40).toString('hex'),
          last_visit: new Date('1989-01-05'),
        });
        await CompanyBee.query().insert({
          bee_id: newUser.id,
          user_id: req.user.user_id,
          rank: 3,
        });

        AuthController.resetRequest(req, reply);
      }
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async removeUser(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as any;
      const result = await CompanyBee.query()
        .delete()
        .where({ bee_id: params.id, user_id: req.user.user_id });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async delete(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as any;
      const otherUser = await Company.query()
        .select('user.id')
        .withGraphJoined('user')
        .whereNot({
          'user.id': req.user.bee_id,
        })
        .where({
          'companies.id': params.company_id,
        });
      if (otherUser.length === 0) {
        reply.send(
          httpErrors.Forbidden(
            'No other users found, cannot remove your access.',
          ),
        );
      }

      const otherCompanies = await Company.query()
        .select('companies.id as id')
        .withGraphJoined('user')
        .where({
          'user.id': req.user.bee_id,
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
      }

      req.body['saved_company'] = otherCompanies[0].id;

      await CompanyBee.query()
        .delete()
        .where({ user_id: params.company_id, bee_id: req.user.bee_id });

      UserController.changeCompany(req, reply);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }
}
