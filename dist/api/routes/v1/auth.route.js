"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const environment_config_js_1 = require("../../../config/environment.config.js");
const zod_1 = require("zod");
const auth_controller_js_1 = __importDefault(require("../../controllers/auth.controller.js"));
const guard_middleware_js_1 = require("../../middlewares/guard.middleware.js");
const constants_config_js_1 = require("../../../config/constants.config.js");
const federated_service_js_1 = require("../../../services/federated.service.js");
const auth_util_js_1 = require("../../utils/auth.util.js");
const login_util_js_1 = require("../../utils/login.util.js");
const crypto_1 = require("crypto");
const http_errors_1 = __importDefault(require("http-errors"));
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    const google = federated_service_js_1.GoogleAuth.getInstance();
    server.post('/register', {
        schema: {
            body: zod_1.z.object({
                email: zod_1.z.string().email(),
                password: zod_1.z.string().min(6).max(128).trim(),
                name: zod_1.z.string().min(3).max(128).trim(),
                lang: zod_1.z.string().min(2).max(2),
                newsletter: zod_1.z.boolean(),
                source: zod_1.z.string(),
            }),
        },
    }, auth_controller_js_1.default.register);
    server.post('/login', {
        schema: {
            body: zod_1.z.object({
                email: zod_1.z.string().email(),
                password: zod_1.z.string().min(6).max(128).trim(),
            }),
        },
    }, auth_controller_js_1.default.login);
    server.get('/logout', {}, auth_controller_js_1.default.logout);
    server.patch('/confirm', {
        schema: {
            body: zod_1.z.object({
                confirm: zod_1.z.string().min(100).max(128),
            }),
        },
    }, auth_controller_js_1.default.confirmMail);
    server.post('/reset', {
        schema: {
            body: zod_1.z.object({
                email: zod_1.z.string().email(),
            }),
        },
    }, auth_controller_js_1.default.resetRequest);
    server.patch('/reset', {
        schema: {
            body: zod_1.z.object({
                key: zod_1.z.string().min(100).max(128),
                password: zod_1.z.string().min(6).max(128).trim(),
            }),
        },
    }, auth_controller_js_1.default.resetPassword);
    server.patch('/unsubscribe', {
        schema: {
            body: zod_1.z.object({
                email: zod_1.z.string().email(),
            }),
        },
    }, auth_controller_js_1.default.unsubscribeRequest);
    server.get('/discourse', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            querystring: zod_1.z.object({
                payload: zod_1.z.string(),
                sig: zod_1.z.string(),
            }),
        },
    }, auth_controller_js_1.default.discourse);
    server.get('/google', {}, async () => {
        return { url: google.generateAuthUrl() };
    });
    server.get('/google/callback', {
        schema: {
            querystring: zod_1.z.object({
                code: zod_1.z.string(),
            }),
        },
    }, async (req, reply) => {
        let result;
        try {
            const token = req.query.code;
            result = await google.verify(token);
            if (!result.bee_id) {
                if (!result.name && !result.email) {
                    throw new Error('No name or email');
                }
                return reply.redirect(environment_config_js_1.frontend +
                    '/visitor/register?name=' +
                    result.name +
                    '&email=' +
                    result.email +
                    '&oauth=google');
            }
        }
        catch (e) {
            req.log.error({ message: 'Error in google callback', error: e });
            return reply.redirect(environment_config_js_1.frontend + '/visitor/login?error=oauth');
        }
        const userAgent = (0, auth_util_js_1.buildUserAgent)(req);
        const { bee_id, user_id, paid, rank } = await (0, login_util_js_1.loginCheck)('', '', result.bee_id);
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
        return reply;
    });
    done();
}
exports.default = routes;
