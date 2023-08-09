"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const guard_middleware_js_1 = require("../../middlewares/guard.middleware.js");
const constants_config_js_1 = require("../../../config/constants.config.js");
const zod_1 = require("zod");
const service_controller_js_1 = __importDefault(require("../../controllers/service.controller.js"));
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    server.get('/temperature/:apiary_id', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
    }, service_controller_js_1.default.getTemperature);
    server.post('/paypal/orders', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                amount: zod_1.z.number().min(50),
            }),
        },
    }, service_controller_js_1.default.paypalCreateOrder);
    server.post('/paypal/orders/:orderID/capture', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
    }, service_controller_js_1.default.paypalCapturePayment);
    server.post('/stripe/orders', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                amount: zod_1.z.number().min(50),
            }),
        },
    }, service_controller_js_1.default.stripeCreateOrder);
    server.post('/wizbee/ask', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user, constants_config_js_1.ROLES.read]),
        schema: {
            body: zod_1.z.object({
                question: zod_1.z.string().min(1).max(1000),
                lang: zod_1.z.string().min(2).max(2),
            }),
        },
    }, service_controller_js_1.default.askWizBee);
    done();
}
exports.default = routes;
