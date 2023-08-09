"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validator_middleware_js_1 = require("../../middlewares/validator.middleware.js");
const external_controller_js_1 = __importDefault(require("../../controllers/external.controller.js"));
const zod_1 = require("zod");
const scale_data_controller_js_1 = __importDefault(require("../../controllers/scale_data.controller.js"));
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    server.get('/ical/:source/:api', { preHandler: validator_middleware_js_1.Validator.handleSource }, external_controller_js_1.default.ical);
    server.post('/stripe/webhook', {}, external_controller_js_1.default.stripeWebhook);
    server.get('/scale/:ident/:api', {
        schema: {
            querystring: zod_1.z.object({
                action: zod_1.z.string().regex(/^(CREATE|CREATE_DEMO)$/),
                datetime: zod_1.z.string().datetime().optional(),
                weight: zod_1.z.coerce.number().optional(),
                temp1: zod_1.z.coerce.number().optional(),
                temp2: zod_1.z.coerce.number().optional(),
                hum: zod_1.z.coerce.number().optional(),
                rain: zod_1.z.coerce.number().optional(),
                note: zod_1.z.string().max(300).optional(),
            }),
        },
    }, scale_data_controller_js_1.default.api);
    done();
}
exports.default = routes;
