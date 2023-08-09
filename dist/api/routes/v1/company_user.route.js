"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const guard_middleware_js_1 = require("../../middlewares/guard.middleware.js");
const constants_config_js_1 = require("../../../config/constants.config.js");
const company_user_controller_js_1 = __importDefault(require("../../controllers/company_user.controller.js"));
const zod_1 = require("zod");
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    server.get('/user', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]) }, company_user_controller_js_1.default.getUser);
    server.post('/add_user', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        schema: {
            body: zod_1.z.object({
                email: zod_1.z.string().email(),
            }),
        },
    }, company_user_controller_js_1.default.addUser);
    server.delete('/remove_user/:id', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]) }, company_user_controller_js_1.default.removeUser);
    server.delete('/:company_id', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user, constants_config_js_1.ROLES.read]) }, company_user_controller_js_1.default.delete);
    server.patch('/:id', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        schema: {
            params: zod_1.z.object({
                id: zod_1.z.string(),
            }),
            body: zod_1.z.object({
                rank: zod_1.z.number(),
            }),
        },
    }, company_user_controller_js_1.default.patch);
    done();
}
exports.default = routes;
