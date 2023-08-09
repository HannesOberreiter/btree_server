"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const guard_middleware_js_1 = require("../../middlewares/guard.middleware.js");
const constants_config_js_1 = require("../../../config/constants.config.js");
const zod_1 = require("zod");
const feed_controller_js_1 = __importDefault(require("../../controllers/feed.controller.js"));
const zod_util_js_1 = require("../../utils/zod.util.js");
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    server.get('/', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
    }, feed_controller_js_1.default.get);
    server.post('/', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z
                .object({
                hive_ids: zod_1.z.array(zod_util_js_1.numberSchema),
                interval: zod_1.z.number().min(0).max(365).optional(),
                repeat: zod_1.z.number().min(0).max(15).optional(),
            })
                .passthrough(),
        },
    }, feed_controller_js_1.default.post);
    server.patch('/', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
                data: zod_1.z.object({}).passthrough(),
            }),
        },
    }, feed_controller_js_1.default.patch);
    server.patch('/status', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
                status: zod_1.z.boolean(),
            }),
        },
    }, feed_controller_js_1.default.updateStatus);
    server.patch('/date', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
                start: zod_1.z.string(),
                end: zod_1.z.string(),
            }),
        },
    }, feed_controller_js_1.default.updateDate);
    server.patch('/batchDelete', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
            }),
        },
    }, feed_controller_js_1.default.batchDelete);
    server.post('/batchGet', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
            }),
        },
    }, feed_controller_js_1.default.batchGet);
    done();
}
exports.default = routes;
