import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { federatedUser } from '../../services/federated.service.js';
import type { RegisterBody } from '../routes/v1/auth.route.js';
import { randomBytes, randomUUID } from 'node:crypto';
import dayjs from 'dayjs';
import httpErrors from 'http-errors';
import { ENVIRONMENT } from '../../config/constants.config.js';
import {
  discourseSecret,
  env,
  frontend,
  serverLocation,
} from '../../config/environment.config.js';
import { DiscourseSSO } from '../../services/discourse.service.js';
import { AppleAuth, GoogleAuth } from '../../services/federated.service.js';
import { MailService } from '../../services/mail.service.js';
import { Company } from '../models/company.model.js';
import { CompanyBee } from '../models/company_bee.model.js';
import { User } from '../models/user.model.js';
import { AppleCallbackGETSchema, AppleCallbackSchema } from '../routes/v1/auth.route.js';
import {
  buildUserAgent,
  confirmAccount,
  createHashedPassword,
  resetMail,
  resetPassword,
  unsubscribeMail,
} from '../utils/auth.util.js';
import { autoFill } from '../utils/autofill.util.js';
import { loginCheck } from '../utils/login.util.js';

export default class AuthController {
  static async confirmMail(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const key = body.confirm;
    const u = await User.query().findOne({
      reset: key,
    });
    if (!u) {
      return httpErrors.Forbidden('Confirm Key not found');
    }
    const result = await confirmAccount(u.id);
    return { email: result };
  }

  static async resetRequest(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const email = body.email;
    const u = await User.query().findOne({
      email,
    });
    if (!u) {
      // "Best Practice" don't tell anyone if the user exists
      // return next(badRequest('User not found!'));
      return { email };
    }
    const result = await resetMail(u.id);

    const mail = await MailService.getInstance().sendMail({
      to: result.email,
      lang: result.lang,
      subject: 'pw_reset',
      name: result.username,
      key: result.reset,
    });
    if (!mail) {
      throw httpErrors.Unauthorized('mail');
    }
    if (env !== ENVIRONMENT.production) {
      return {
        email: result.email,
        token: result.reset,
        id: result.id,
      };
    }
    return { email: result.email };
  }

  static async unsubscribeRequest(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const email = body.email;
    const u = await User.query().findOne({
      email,
    });
    if (!u) {
      // "Best Practice" don't tell anyone if the user exists
      // return next(badRequest('User not found!'));
      return { email };
    }
    const result = await unsubscribeMail(u.id);
    return { email: result };
  }

  static async resetPassword(req: FastifyRequest, _reply: FastifyReply) {
    const { key, password } = req.body as any;
    const u = await User.query().findOne({
      reset: key,
    });
    if (!u) {
      return httpErrors.NotFound('Reset key not found!');
    }
    if (dayjs().diff(u.reset_timestamp, 'hours') > 24) {
      return httpErrors.Forbidden('Reset key too old!');
    }
    const result = await resetPassword(u.id, password);
    await MailService.getInstance().sendMail({
      to: result.email,
      lang: result.lang,
      subject: 'pw_reseted',
      name: result.username,
    });
    return { email: result.email };
  }

  static async register(req: FastifyRequest, _reply: FastifyReply) {
    req.log.debug({ message: 'Register attempt', ip: req.ip, body: req.body });
    const body = req.body as RegisterBody;
    const inputCompany = body.name;
    const inputUser = body;
    delete inputUser.name;
    const isOAuth = body.isOAuth || false;
    delete inputUser.isOAuth;

    if (isOAuth) {
      // for OAuth registrations we reset the temp password
      inputUser.password = randomBytes(16).toString('hex');
    }

    // create hashed password and salt
    const hash = createHashedPassword(inputUser.password);
    delete inputUser.password;
    // We use the password reset key for email confirmation
    // if the user did not get it is possible to use "forgot password" in addition
    // which will also activate the user
    const reset = randomBytes(64).toString('hex');
    // we only have German or English available for autofill
    const autofillLang = inputUser.lang === 'de' ? 'de' : 'en';
    await User.transaction(async (trx) => {
      const uniqueMail = await User.query(trx).findOne({
        email: inputUser.email,
      });
      if (uniqueMail) {
        throw httpErrors.Conflict('email');
      }

      const u = await User.query(trx).insert({
        ...inputUser,
        password: hash.password,
        salt: hash.salt,
        reset,
        state: isOAuth ? 1 : 0, // OAuth users are confirmed by default
      });
      const c = await Company.query(trx).insert({
        name: inputCompany,
        paid: dayjs().add(31, 'day').format('YYYY-MM-DD'),
      });
      await CompanyBee.query(trx).insert({ bee_id: u.id, user_id: c.id });
      await autoFill(trx, c.id, autofillLang);
    });

    const mail = await MailService.getInstance().sendMail({
      to: inputUser.email,
      lang: inputUser.lang,
      subject: isOAuth ? 'register_oauth' : 'register',
      key: reset,
    });

    if (!mail) {
      throw httpErrors.Unauthorized('mail');
    }

    return { email: inputUser.email, activate: reset };
  }

  static logout(req: FastifyRequest, reply: FastifyReply) {
    req.session.destroy((err) => {
      if (err) {
        throw err;
      }
      reply.status(200).send(true);
      return reply;
    });
  }

  static async login(req: FastifyRequest, _reply: FastifyReply) {
    const { email, password } = req.body as any;
    const userAgent = buildUserAgent(req);
    const { bee_id, user_id, data, paid, rank } = await loginCheck(
      email,
      password,
    );

    // Add bee_id to req as regenerate will call genid which uses bee_id as prefix to store key
    // see app.config.ts session(genId: function);
    (req as any).bee_id = bee_id;
    try {
      await req.session.regenerate();
      req.session.user = {
        bee_id,
        user_id,
        paid,
        rank: rank as any,
        user_agent: userAgent,
        last_visit: new Date(),
        uuid: randomUUID(),
        ip: req.ip,
      };
      await req.session.save();
    }
    catch (e) {
      req.log.error(e);
      throw httpErrors[500]('Failed to create session');
    }
    return { data };
  }

  static async discourse(req: FastifyRequest, _reply: FastifyReply) {
    const sso = new DiscourseSSO(discourseSecret);
    const { payload, sig } = req.query as any;
    if (payload && sig) {
      if (sso.validate(payload, sig)) {
        const user = await User.query()
          .select('id', 'username', 'email')
          .findById(req.session.user.bee_id)
          .throwIfNotFound();

        const nonce = sso.getNonce(payload);
        const userparams = {
          nonce,
          external_id: user.id,
          email: user.email,
          username: user.username ? user.username : `anonymous_${user.id}`,
          name: user.username ? user.username : `anonymous_${user.id}`,
          suppress_welcome_message: true,
          require_activation: false,
        };
        const q = sso.buildLoginString(userparams);
        return { q };
      }
      else {
        throw httpErrors.Forbidden('Invalid Signature');
      }
    }
    else {
      throw httpErrors.Forbidden('Missing Signature');
    }
  }

  /**
   * @description handle google oauth callback, redirect to register page if user does not exist or login otherwise with session cookie
   */
  static async google(req: FastifyRequest, reply: FastifyReply) {
    const google = GoogleAuth.getInstance();
    let result: federatedUser;
    const token = (req.query as any).code as string;

    try {
      result = await google.verify(token);
      if (!result.bee_id) {
        if (!result.name && !result.email) {
          throw new Error('No name or email');
        }
        return reply.redirect(
          encodeURI(
            `${frontend
            }/visitor/register?name=${
              result.name
            }&email=${
              result.email
            }&oauth=google`
            + `&server=${
              serverLocation}`,
          ),
        );
      }
    }
    catch (e) {
      req.log.error({ message: 'Error in google callback', error: e });
      return reply.redirect(
        `${frontend}/visitor/login?error=oauth&server=${serverLocation}`,
      );
    }

    const userAgent = buildUserAgent(req);

    const { bee_id, user_id, paid, rank } = await loginCheck(
      '',
      '',
      result.bee_id,
    );

    try {
      (req as any).bee_id = bee_id;
      await req.session.regenerate();
      req.session.user = {
        bee_id,
        user_id,
        paid,
        rank: rank as any,
        user_agent: userAgent,
        last_visit: new Date(),
        uuid: randomUUID(),
        ip: req.ip,
      };
      await req.session.save();
    }
    catch (e) {
      req.log.error(e);
      throw httpErrors[500]('Failed to create session');
    }
    reply.redirect(`${frontend}/visitor/login?server=${serverLocation}`);
    return reply;
  }

  static async apple(req: FastifyRequest, reply: FastifyReply) {
    const apple = AppleAuth.getInstance();
    let result: federatedUser;
    let body: z.infer<typeof AppleCallbackSchema>;

    try {
      if (req.method === 'GET') {
        const query = AppleCallbackGETSchema.parse(req.query);

        const transformedQuery: any = {
          code: query.code,
          id_token: query.id_token,
          state: query.state,
          error: query.error,
          user: undefined,
        };

        if (query.user && query.user.trim() !== '') {
          try {
            const userObj = JSON.parse(decodeURIComponent(query.user));
            transformedQuery.user = userObj;
          }
          catch (parseError) {
            req.log.warn({ message: 'Failed to parse user field from Apple callback', error: parseError });
          }
        }

        body = AppleCallbackSchema.parse(transformedQuery);
      }
      else {
        body = AppleCallbackSchema.parse(req.body);
      }

      if (body.error) {
        req.log.error({ message: 'Apple callback error', error: body.error });
        return reply.redirect(
          `${frontend}/visitor/login?error=oauth&server=${serverLocation}`,
        );
      }
    }
    catch (error) {
      req.log.error({ message: 'Invalid Apple callback body', error });
      return reply.redirect(
        `${frontend}/visitor/login?error=oauth&server=${serverLocation}`,
      );
    }

    try {
      result = await apple.verify(body.code);
      if (!result.bee_id) {
        return reply.redirect(
          encodeURI(
            `${frontend
            }/visitor/register?email=${
              result.email
            }&oauth=apple`
            + `&server=${
              serverLocation}`,
          ),
        );
      }
    }
    catch (e) {
      req.log.error({ message: 'Error in apple callback', error: e });
      return reply.redirect(
        `${frontend}/visitor/login?error=oauth&server=${serverLocation}`,
      );
    }

    const userAgent = buildUserAgent(req);

    const { bee_id, user_id, paid, rank } = await loginCheck(
      '',
      '',
      result.bee_id,
    );

    try {
      (req as any).bee_id = bee_id;
      await req.session.regenerate();
      req.session.user = {
        bee_id,
        user_id,
        paid,
        rank: rank as any,
        user_agent: userAgent,
        last_visit: new Date(),
        uuid: randomUUID(),
        ip: req.ip,
      };
      await req.session.save();
    }
    catch (e) {
      req.log.error(e);
      throw httpErrors[500]('Failed to create session');
    }
    reply.redirect(`${frontend}/visitor/login?server=${serverLocation}`);
    return reply;
  }
}
