"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const guard_middleware_js_1 = require("../../middlewares/guard.middleware.js");
const constants_config_js_1 = require("../../../config/constants.config.js");
const apiary_controller_js_1 = __importDefault(require("../../controllers/apiary.controller.js"));
const zod_1 = require("zod");
const zod_util_js_1 = require("../../utils/zod.util.js");
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    server.get('/', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
    }, apiary_controller_js_1.default.get);
    server.get('/:id', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
    }, apiary_controller_js_1.default.getDetail);
    server.post('/', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        schema: {
            body: zod_1.z
                .object({
                name: zod_1.z.string().min(3).max(255),
            })
                .passthrough(),
        },
    }, apiary_controller_js_1.default.post);
    server.patch('/', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
    }, apiary_controller_js_1.default.patch);
    server.patch('/batchDelete', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
            }),
        },
    }, apiary_controller_js_1.default.batchDelete);
    server.post('/batchGet', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
            }),
        },
    }, apiary_controller_js_1.default.batchGet);
    server.patch('/status', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
                status: zod_1.z.boolean(),
            }),
        },
    }, apiary_controller_js_1.default.updateStatus);
    done();
}
exports.default = routes;
