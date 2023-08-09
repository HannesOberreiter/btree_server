"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const guard_middleware_js_1 = require("../../middlewares/guard.middleware.js");
const constants_config_js_1 = require("../../../config/constants.config.js");
const zod_1 = require("zod");
const rearing_step_controller_js_1 = __importDefault(require("../../controllers/rearing_step.controller.js"));
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    server.post('/', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
    }, rearing_step_controller_js_1.default.post);
    server.delete('/:id', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        schema: {
            params: zod_1.z.object({
                id: zod_1.z.string(),
            }),
        },
    }, rearing_step_controller_js_1.default.delete);
    server.patch('/updatePosition', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        schema: {
            body: zod_1.z.object({
                data: zod_1.z.array(zod_1.z.object({
                    id: zod_1.z.number(),
                    position: zod_1.z.number(),
                    sleep_before: zod_1.z.number(),
                })),
            }),
        },
    }, rearing_step_controller_js_1.default.updatePosition);
    done();
}
exports.default = routes;
