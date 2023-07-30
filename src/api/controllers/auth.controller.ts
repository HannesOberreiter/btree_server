import { autoFill } from '@utils/autofill.util';
import { checkMySQLError } from '@utils/error.util';
import { Company } from '@models/company.model';
import { CompanyBee } from '@models/company_bee.model';
import { loginCheck } from '@utils/login.util';
import { randomBytes, randomUUID } from 'crypto';
import { User } from '@models/user.model';
import dayjs from 'dayjs';
import {
  createHashedPassword,
  confirmAccount,
  resetMail,
  resetPassword,
  unsubscribeMail,
  buildUserAgent,
} from '@utils/auth.util';
import { discourseSecret, env, frontend } from '@/config/environment.config';
import { MailServer } from '../app.bootstrap';

import { DiscourseSSO } from '../services/discourse.service';
import { FastifyReply, FastifyRequest } from 'fastify';
import fastifyPassport from '@fastify/passport';
import httpErrors from 'http-errors';
import { ENVIRONMENT } from '@/config/constants.config';

export default class AuthController {
  static async confirmMail(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const key = body.confirm;
    const u = await User.query().findOne({
      reset: key,
    });
    if (!u) {
      reply.send(httpErrors.Forbidden('Confirm Key not found'));
    }
    const result = await confirmAccount(u.id);
    reply.send({ email: result });
  }

  static async resetRequest(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const email = body.email;
    const u = await User.query().findOne({
      email: email,
    });
    if (!u) {
      // "Best Practice" don't tell anyone if the user exists
      // return next(badRequest('User not found!'));
      reply.send({ email: email });
    }
    const result = await resetMail(u.id);

    await MailServer.sendMail({
      to: result.email,
      lang: result.lang,
      subject: 'pw_reset',
      name: result.username,
      key: result.reset,
    });
    if (env !== ENVIRONMENT.production) {
      reply.send({
        email: result.email,
        token: result.reset,
        id: result.id,
      });
    }
    reply.send({ email: result.email });
  }

  static async unsubscribeRequest(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const email = body.email;
    const u = await User.query().findOne({
      email: email,
    });
    if (!u) {
      // "Best Practice" don't tell anyone if the user exists
      // return next(badRequest('User not found!'));
      reply.send({ email: email });
    }
    const result = await unsubscribeMail(u.id);
    reply.send({ email: result });
  }

  static async resetPassword(req: FastifyRequest, reply: FastifyReply) {
    const { key, password } = req.body as any;
    const u = await User.query().findOne({
      reset: key,
    });
    if (!u) {
      reply.send(httpErrors.NotFound('Reset key not found!'));
    }
    if (dayjs().diff(u.reset_timestamp, 'hours') > 24) {
      reply.send(httpErrors.Forbidden('Reset key too old!'));
    }
    const result = await resetPassword(u.id, password);
    await MailServer.sendMail({
      to: result.email,
      lang: result.lang,
      subject: 'pw_reseted',
      name: result.username,
    });
    reply.send({ email: result.email });
  }

  static async register(req: FastifyRequest, reply: FastifyReply) {
    const inputCompany = (req.body as any).name;
    let inputUser = req.body as any;
    delete inputUser['name'];

    // create hashed password and salt
    const hash = createHashedPassword(inputUser.password);
    inputUser.password = hash.password;
    inputUser.salt = hash.salt;
    // We use the password reset key for email confirmation
    // if the user did not get it is possible to use "forgot password" in addition
    // which will also activate the user
    inputUser.reset = randomBytes(64).toString('hex');
    // we only have german or english available for autofill
    const autofillLang = inputUser.lang == 'de' ? 'de' : 'en';
    try {
      await User.transaction(async (trx) => {
        const uniqueMail = await User.query(trx).findOne({
          email: inputUser.email,
        });
        if (uniqueMail) {
          reply.send(httpErrors.Conflict('email'));
        }

        const u = await User.query(trx).insert({ ...inputUser, state: 0 });
        const c = await Company.query(trx).insert({
          name: inputCompany,
          paid: dayjs().add(31, 'day').format('YYYY-MM-DD'),
        });
        await CompanyBee.query(trx).insert({ bee_id: u.id, user_id: c.id });
        await autoFill(trx, c.id, autofillLang);
      });

      await MailServer.sendMail({
        to: inputUser.email,
        lang: inputUser.lang,
        subject: 'register',
        key: inputUser.reset,
      });

      reply.send({ email: inputUser.email, activate: inputUser.reset });
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async logout(req: FastifyRequest, reply: FastifyReply) {
    req.session.destroy(function (err) {
      if (err) {
        if (err instanceof Error) {
          throw err;
        }
        throw Error(err);
      }
    });
    req.logOut();
    reply.send(true);
  }

  static async login(req: FastifyRequest, reply: FastifyReply) {
    const { email, password } = req.body as any;
    const userAgent = buildUserAgent(req);
    const { bee_id, user_id, data, paid, rank } = await loginCheck(
      email,
      password,
    );

    //const token = await generateTokenResponse(bee_id, user_id, userAgent);
    // Add bee_id to req as regenerate will call genid which uses bee_id as prefix to store key
    // see app.config.ts session(genId: function);

    req['bee_id'] = bee_id;
    try {
      await req.session.regenerate();
      fastifyPassport.registerUserSerializer(async (user, request) => {
        return (user = {
          bee_id: bee_id,
          user_id: user_id,
          paid: paid,
          rank: rank as any,
          user_agent: userAgent,
          last_visit: new Date(),
          uuid: randomUUID(),
          ip: request.ip,
        });
      });
      await req.session.save();
    } catch (e) {
      req.log.error(e);
      reply.send(httpErrors[500]('Failed to create session'));
    }
    reply.send({ data });
  }

  static async discourse(req: FastifyRequest, reply: FastifyReply) {
    const sso = new DiscourseSSO(discourseSecret);
    const { payload, sig } = req.query as any;
    if (payload && sig) {
      try {
        if (sso.validate(payload, sig)) {
          const user = await User.query()
            .select('id', 'username', 'email')
            .findById(req.user.bee_id)
            .throwIfNotFound();

          const nonce = sso.getNonce(payload);
          const userparams = {
            nonce: nonce,
            external_id: user.id,
            email: user.email,
            username: user.username ? user.username : 'anonymous_' + user.id,
            name: user.username ? user.username : 'anonymous_' + user.id,
            suppress_welcome_message: true,
            require_activation: false,
          };
          const q = sso.buildLoginString(userparams);
          reply.send(q);
        } else {
          reply.send(httpErrors.Forbidden('Invalid Signature'));
        }
      } catch (e) {
        reply.send(checkMySQLError(e));
      }
    } else {
      reply.send(httpErrors.Forbidden('Missing Signature'));
    }
  }

  /**
   * @description handle google oauth callback, redirect to register page if user does not exist or login otherwise with session cookie
   */
  static async google(req: FastifyRequest, reply: FastifyReply) {
    if (!req.user.bee_id) {
      if (!req.user['name'] && !req.user['email']) {
        return reply.redirect(frontend + '/visitor/login?error=oauth');
      }
      return reply.redirect(
        frontend +
          '/visitor/register?name=' +
          req.user['name'] +
          '&email=' +
          req.user['email'] +
          '&oauth=google',
      );
    }

    const userAgent = buildUserAgent(req);

    const { bee_id, user_id, paid, rank } = await loginCheck(
      '',
      '',
      req.user.bee_id,
    );

    try {
      await req.session.regenerate();
      fastifyPassport.registerUserSerializer(async (user, request) => {
        return (user = {
          bee_id: bee_id,
          user_id: user_id,
          paid: paid,
          rank: rank as any,
          user_agent: userAgent,
          last_visit: new Date(),
          uuid: randomUUID(),
          ip: request.ip,
        });
      });
      await req.session.save();
    } catch (e) {
      req.log.error(e);
      reply.send(httpErrors[500]('Failed to create session'));
    }
    reply.redirect(frontend + '/visitor/login');
  }
}
