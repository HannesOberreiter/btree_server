"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const guard_middleware_js_1 = require("../../middlewares/guard.middleware.js");
const constants_config_js_1 = require("../../../config/constants.config.js");
const zod_1 = require("zod");
const company_controller_js_1 = __importDefault(require("../../controllers/company.controller.js"));
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    server.get('/apikey', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]) }, company_controller_js_1.default.getApikey);
    server.get('/count', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]) }, company_controller_js_1.default.getCounts);
    server.get('/download', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]) }, company_controller_js_1.default.download);
    server.patch('', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        schema: {
            body: zod_1.z
                .object({
                name: zod_1.z.string().min(3).max(128).trim().optional(),
            })
                .passthrough(),
        },
    }, company_controller_js_1.default.patch);
    server.post('', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                name: zod_1.z.string().min(3).max(128).trim(),
            }),
        },
    }, company_controller_js_1.default.post);
    server.post('/coupon', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                coupon: zod_1.z.string().min(3).max(128).trim(),
            }),
        },
    }, company_controller_js_1.default.postCoupon);
    server.delete('/:id', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]) }, company_controller_js_1.default.delete);
    done();
}
exports.default = routes;
