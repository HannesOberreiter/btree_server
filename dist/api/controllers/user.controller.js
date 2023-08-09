"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = require("node:crypto");
const lodash_1 = require("lodash");
const http_errors_1 = __importDefault(require("http-errors"));
const error_util_js_1 = require("../utils/error.util.js");
const user_model_js_1 = require("../models/user.model.js");
const company_bee_model_js_1 = require("../models/company_bee.model.js");
const login_util_js_1 = require("../utils/login.util.js");
const auth_util_js_1 = require("../utils/auth.util.js");
const delete_util_js_1 = require("../utils/delete.util.js");
const app_bootstrap_js_1 = require("../../app.bootstrap.js");
const federated_credential_js_1 = require("../models/federated_credential.js");
const redis_server_js_1 = require("../../servers/redis.server.js");
class UserController {
    static async getFederatedCredentials(req, reply) {
        const data = await federated_credential_js_1.FederatedCredential.query().where({
            bee_id: req.session.user.bee_id,
        });
        return data;
    }
    static async deleteFederatedCredentials(req, reply) {
        const params = req.params;
        if (!params.id) {
            throw http_errors_1.default.BadRequest('Missing id');
        }
        const data = await federated_credential_js_1.FederatedCredential.query().delete().where({
            bee_id: req.session.user.bee_id,
            id: params.id,
        });
        return data;
    }
    static async addFederatedCredentials(req, reply) {
        const body = req.body;
        if (!body.email) {
            throw http_errors_1.default.BadRequest('Missing mail');
        }
        const data = await federated_credential_js_1.FederatedCredential.query().insert({
            bee_id: req.session.user.bee_id,
            provider: 'google',
            mail: body.email,
        });
        return { data };
    }
    static async get(req, reply) {
        const data = await (0, login_util_js_1.fetchUser)('', req.session.user.bee_id);
        // Check if connected company exists (last visited company)
        // otherwise take the simply the first one
        let company;
        if (data.company.some((el) => el.id === data.saved_company)) {
            company = data.saved_company;
        }
        else {
            company = data.company[0].id;
        }
        const { rank, paid } = await (0, login_util_js_1.getPaidRank)(data.id, company);
        req['bee_id'] = req.session.user.bee_id;
        await req.session.regenerate();
        req.session.user = {
            bee_id: data.id,
            user_id: company,
            paid: paid,
            rank: rank,
            user_agent: (0, auth_util_js_1.buildUserAgent)(req),
            last_visit: new Date(),
            uuid: (0, node_crypto_1.randomUUID)(),
            ip: req.ip,
        };
        await req.session.save();
        return { ...data };
    }
    static async delete(req, reply) {
        const body = req.body;
        await (0, login_util_js_1.reviewPassword)(req.session.user.bee_id, body.password);
        const companies = await company_bee_model_js_1.CompanyBee.query().where({
            bee_id: req.session.user.bee_id,
        });
        await Promise.all((0, lodash_1.map)(companies, async (company) => {
            const count = await company_bee_model_js_1.CompanyBee.query().select('id').where({
                user_id: company.user_id,
            });
            if (count.length === 1 && company.user_id) {
                await (0, delete_util_js_1.deleteCompany)(company.user_id);
            }
            return true;
        }));
        const result = await (0, delete_util_js_1.deleteUser)(req.session.user.bee_id);
        return result;
    }
    static async checkPassword(req, reply) {
        const body = req.body;
        if ('password' in body) {
            const result = await (0, login_util_js_1.reviewPassword)(req.session.user.bee_id, body.password);
            return result;
        }
        return {};
    }
    static async patch(req, reply) {
        const body = req.body;
        const trx = await user_model_js_1.User.startTransaction();
        try {
            if ('password' in body) {
                try {
                    await (0, login_util_js_1.reviewPassword)(req.session.user.bee_id, body.password);
                }
                catch (e) {
                    throw (0, error_util_js_1.checkMySQLError)(e);
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
                        const password = (0, auth_util_js_1.createHashedPassword)(body.newPassword);
                        delete body.newPassword;
                        body.password = password.password;
                        body.salt = password.salt;
                    }
                }
            }
            await user_model_js_1.User.query(trx).findById(req.session.user.bee_id).patch(req.body);
            await trx.commit();
            const user = await (0, login_util_js_1.fetchUser)('', req.session.user.bee_id);
            if ('salt' in body) {
                try {
                    await app_bootstrap_js_1.MailServer.sendMail({
                        to: user['email'],
                        lang: user['lang'],
                        subject: 'pw_reseted',
                        name: user['username'],
                    });
                }
                catch (e) {
                    throw (0, error_util_js_1.checkMySQLError)(e);
                }
            }
            return user;
        }
        catch (e) {
            await trx.rollback();
            throw e;
        }
    }
    static async changeCompany(req, reply) {
        const body = req.body;
        const trx = await user_model_js_1.User.startTransaction();
        try {
            await company_bee_model_js_1.CompanyBee.query()
                .where('bee_id', req.session.user.bee_id)
                .where('user_id', body.saved_company)
                .throwIfNotFound();
            const result = await user_model_js_1.User.query(trx)
                .findById(req.session.user.bee_id)
                .patch({
                saved_company: body.saved_company,
            });
            await trx.commit();
            const data = await (0, login_util_js_1.fetchUser)('', req.session.user.bee_id);
            const { rank, paid } = await (0, login_util_js_1.getPaidRank)(data.id, body.saved_company);
            req['bee_id'] = req.session.user.bee_id;
            await req.session.regenerate();
            req.session.user = {
                bee_id: data.id,
                user_id: body.saved_company,
                paid: paid,
                rank: rank,
                user_agent: (0, auth_util_js_1.buildUserAgent)(req),
                last_visit: new Date(),
                uuid: (0, node_crypto_1.randomUUID)(),
                ip: req.ip,
            };
            await req.session.save();
            return { data: data, result: result };
            //const userAgent = buildUserAgent(req);
            /*const token = await generateTokenResponse(
              req.session.user.bee_id,
              req.body.saved_company,
              userAgent
            );*/
        }
        catch (e) {
            await trx.rollback();
            throw e;
        }
    }
    static async getRedisSession(req, reply) {
        const { bee_id } = req.session.user;
        let keys = [];
        let cursor = 0;
        let safety = 1000;
        while (safety-- > 0) {
            const result = await redis_server_js_1.RedisServer.client.scan(cursor, 'MATCH', `btree_sess:${bee_id}:*`, 'COUNT', 500);
            if (result[1].length > 0) {
                keys = keys.concat(result[1]);
            }
            const nextCursor = parseInt(result[0]);
            if (nextCursor === 0)
                break;
            cursor = nextCursor;
        }
        if (keys.length === 0) {
            return [];
        }
        const content = await redis_server_js_1.RedisServer.client.mget(keys);
        const result = content
            .map((el, index) => {
            const o = JSON.parse(el);
            if (!o.user)
                return null;
            o.id = keys[index];
            o.user['currentSession'] =
                o.user?.uuid && o.user?.uuid === req.session.user.uuid;
            return o;
        })
            .filter((el) => el !== null);
        return result;
    }
    static async deleteRedisSession(req, reply) {
        const { bee_id } = req.session.user;
        const { id } = req.params;
        const lastPart = id.split(':').at(-1);
        const result = await redis_server_js_1.RedisServer.client.del(`btree_sess:${bee_id}:${lastPart}`);
        return result;
    }
}
exports.default = UserController;
