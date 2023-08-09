"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const guard_middleware_js_1 = require("../../middlewares/guard.middleware.js");
const constants_config_js_1 = require("../../../config/constants.config.js");
const zod_1 = require("zod");
const scale_controller_js_1 = __importDefault(require("../../controllers/scale.controller.js"));
const zod_util_js_1 = require("../../utils/zod.util.js");
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    server.get('/:id?', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user, constants_config_js_1.ROLES.read]) }, scale_controller_js_1.default.get);
    server.patch('/', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
                data: zod_1.z.object({}).passthrough(),
            }),
        },
    }, scale_controller_js_1.default.patch);
    server.post('/', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        schema: {
            body: zod_1.z
                .object({
                name: zod_1.z.string().min(1).max(45).trim(),
                hive_id: zod_1.z.number(),
            })
                .passthrough(),
        },
    }, scale_controller_js_1.default.post);
    server.delete('/:id', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        schema: {
            params: zod_1.z.object({
                id: zod_1.z.string(),
            }),
        },
    }, scale_controller_js_1.default.delete);
    done();
}
exports.default = routes;
