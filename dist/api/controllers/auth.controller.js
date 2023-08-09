"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const http_errors_1 = __importDefault(require("http-errors"));
const crypto_1 = require("crypto");
const auth_util_js_1 = require("../utils/auth.util.js");
const environment_config_js_1 = require("../../config/environment.config.js");
const app_bootstrap_js_1 = require("../../app.bootstrap.js");
const autofill_util_js_1 = require("../utils/autofill.util.js");
const company_model_js_1 = require("../models/company.model.js");
const company_bee_model_js_1 = require("../models/company_bee.model.js");
const login_util_js_1 = require("../utils/login.util.js");
const user_model_js_1 = require("../models/user.model.js");
const discourse_service_js_1 = require("../../services/discourse.service.js");
const constants_config_js_1 = require("../../config/constants.config.js");
class AuthController {
    static async confirmMail(req, reply) {
        const body = req.body;
        const key = body.confirm;
        const u = await user_model_js_1.User.query().findOne({
            reset: key,
        });
        if (!u) {
            return http_errors_1.default.Forbidden('Confirm Key not found');
        }
        const result = await (0, auth_util_js_1.confirmAccount)(u.id);
        return { email: result };
    }
    static async resetRequest(req, reply) {
        const body = req.body;
        const email = body.email;
        const u = await user_model_js_1.User.query().findOne({
            email: email,
        });
        if (!u) {
            // "Best Practice" don't tell anyone if the user exists
            // return next(badRequest('User not found!'));
            return { email: email };
        }
        const result = await (0, auth_util_js_1.resetMail)(u.id);
        await app_bootstrap_js_1.MailServer.sendMail({
            to: result.email,
            lang: result.lang,
            subject: 'pw_reset',
            name: result.username,
            key: result.reset,
        });
        if (environment_config_js_1.env !== constants_config_js_1.ENVIRONMENT.production) {
            return {
                email: result.email,
                token: result.reset,
                id: result.id,
            };
        }
        return { email: result.email };
    }
    static async unsubscribeRequest(req, reply) {
        const body = req.body;
        const email = body.email;
        const u = await user_model_js_1.User.query().findOne({
            email: email,
        });
        if (!u) {
            // "Best Practice" don't tell anyone if the user exists
            // return next(badRequest('User not found!'));
            return { email: email };
        }
        const result = await (0, auth_util_js_1.unsubscribeMail)(u.id);
        return { email: result };
    }
    static async resetPassword(req, reply) {
        const { key, password } = req.body;
        const u = await user_model_js_1.User.query().findOne({
            reset: key,
        });
        if (!u) {
            return http_errors_1.default.NotFound('Reset key not found!');
        }
        if ((0, dayjs_1.default)().diff(u.reset_timestamp, 'hours') > 24) {
            return http_errors_1.default.Forbidden('Reset key too old!');
        }
        const result = await (0, auth_util_js_1.resetPassword)(u.id, password);
        await app_bootstrap_js_1.MailServer.sendMail({
            to: result.email,
            lang: result.lang,
            subject: 'pw_reseted',
            name: result.username,
        });
        return { email: result.email };
    }
    static async register(req, reply) {
        const inputCompany = req.body.name;
        let inputUser = req.body;
        delete inputUser['name'];
        // create hashed password and salt
        const hash = (0, auth_util_js_1.createHashedPassword)(inputUser.password);
        inputUser.password = hash.password;
        inputUser.salt = hash.salt;
        // We use the password reset key for email confirmation
        // if the user did not get it is possible to use "forgot password" in addition
        // which will also activate the user
        inputUser.reset = (0, crypto_1.randomBytes)(64).toString('hex');
        // we only have german or english available for autofill
        const autofillLang = inputUser.lang == 'de' ? 'de' : 'en';
        await user_model_js_1.User.transaction(async (trx) => {
            const uniqueMail = await user_model_js_1.User.query(trx).findOne({
                email: inputUser.email,
            });
            if (uniqueMail) {
                throw http_errors_1.default.Conflict('email');
            }
            const u = await user_model_js_1.User.query(trx).insert({ ...inputUser, state: 0 });
            const c = await company_model_js_1.Company.query(trx).insert({
                name: inputCompany,
                paid: (0, dayjs_1.default)().add(31, 'day').format('YYYY-MM-DD'),
            });
            await company_bee_model_js_1.CompanyBee.query(trx).insert({ bee_id: u.id, user_id: c.id });
            await (0, autofill_util_js_1.autoFill)(trx, c.id, autofillLang);
        });
        await app_bootstrap_js_1.MailServer.sendMail({
            to: inputUser.email,
            lang: inputUser.lang,
            subject: 'register',
            key: inputUser.reset,
        });
        return { email: inputUser.email, activate: inputUser.reset };
    }
    static logout(req, reply) {
        req.session.destroy((err) => {
            if (err) {
                throw err;
            }
            reply.status(200).send(true);
            return reply;
        });
    }
    static async login(req, reply) {
        const { email, password } = req.body;
        const userAgent = (0, auth_util_js_1.buildUserAgent)(req);
        const { bee_id, user_id, data, paid, rank } = await (0, login_util_js_1.loginCheck)(email, password);
        //const token = await generateTokenResponse(bee_id, user_id, userAgent);
        // Add bee_id to req as regenerate will call genid which uses bee_id as prefix to store key
        // see app.config.ts session(genId: function);
        req['bee_id'] = bee_id;
        try {
            await req.session.regenerate();
            req.session.user = {
                bee_id: bee_id,
                user_id: user_id,
                paid: paid,
                rank: rank,
                user_agent: userAgent,
                last_visit: new Date(),
                uuid: (0, crypto_1.randomUUID)(),
                ip: req.ip,
            };
            await req.session.save();
        }
        catch (e) {
            req.log.error(e);
            throw http_errors_1.default[500]('Failed to create session');
        }
        return { data };
    }
    static async discourse(req, reply) {
        const sso = new discourse_service_js_1.DiscourseSSO(environment_config_js_1.discourseSecret);
        const { payload, sig } = req.query;
        if (payload && sig) {
            if (sso.validate(payload, sig)) {
                const user = await user_model_js_1.User.query()
                    .select('id', 'username', 'email')
                    .findById(req.session.user.bee_id)
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
                return { q };
            }
            else {
                throw http_errors_1.default.Forbidden('Invalid Signature');
            }
        }
        else {
            throw http_errors_1.default.Forbidden('Missing Signature');
        }
    }
    /**
     * @description handle google oauth callback, redirect to register page if user does not exist or login otherwise with session cookie
     */
    static async google(req, reply) {
        if (!req.session.user.bee_id) {
            if (!req.session.user['name'] && !req.session.user['email']) {
                return reply.redirect(environment_config_js_1.frontend + '/visitor/login?error=oauth');
            }
            return reply.redirect(environment_config_js_1.frontend +
                '/visitor/register?name=' +
                req.session.user['name'] +
                '&email=' +
                req.session.user['email'] +
                '&oauth=google');
        }
        const userAgent = (0, auth_util_js_1.buildUserAgent)(req);
        const { bee_id, user_id, paid, rank } = await (0, login_util_js_1.loginCheck)('', '', req.session.user.bee_id);
        try {
            req['bee_id'] = bee_id;
            await req.session.regenerate();
            req.session.user = {
                bee_id: bee_id,
                user_id: user_id,
                paid: paid,
                rank: rank,
                user_agent: userAgent,
                last_visit: new Date(),
                uuid: (0, crypto_1.randomUUID)(),
                ip: req.ip,
            };
            await req.session.save();
        }
        catch (e) {
            req.log.error(e);
            throw http_errors_1.default[500]('Failed to create session');
        }
        reply.redirect(environment_config_js_1.frontend + '/visitor/login');
    }
}
exports.default = AuthController;
