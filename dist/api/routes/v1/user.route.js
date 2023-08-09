"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const guard_middleware_js_1 = require("../../middlewares/guard.middleware.js");
const constants_config_js_1 = require("../../../config/constants.config.js");
const zod_1 = require("zod");
const user_controller_js_1 = __importDefault(require("../../controllers/user.controller.js"));
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    server.get('/', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]) }, user_controller_js_1.default.get);
    server.patch('/', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]) }, user_controller_js_1.default.patch);
    server.patch('/delete', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                password: zod_1.z.string().trim(),
            }),
        },
    }, user_controller_js_1.default.delete);
    server.post('/checkpassword', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                password: zod_1.z.string().trim(),
            }),
        },
    }, user_controller_js_1.default.checkPassword);
    server.patch('/company', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z
                .object({
                saved_company: zod_1.z.number(),
            })
                .passthrough(),
        },
    }, user_controller_js_1.default.changeCompany);
    server.get('/federatedCredentials', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]) }, user_controller_js_1.default.getFederatedCredentials);
    server.delete('/federatedCredentials/:id', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            params: zod_1.z.object({
                id: zod_1.z.number(),
            }),
        },
    }, user_controller_js_1.default.deleteFederatedCredentials);
    server.post('/federatedCredentials', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                email: zod_1.z.string().email(),
            }),
        },
    }, user_controller_js_1.default.addFederatedCredentials);
    server.get('/session', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]) }, user_controller_js_1.default.getRedisSession);
    server.delete('/session/:id', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            params: zod_1.z.object({
                id: zod_1.z.string(),
            }),
        },
    }, user_controller_js_1.default.deleteRedisSession);
    done();
}
exports.default = routes;
