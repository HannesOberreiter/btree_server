"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const guard_middleware_js_1 = require("../../middlewares/guard.middleware.js");
const constants_config_js_1 = require("../../../config/constants.config.js");
const zod_1 = require("zod");
const hive_controller_js_1 = __importDefault(require("../../controllers/hive.controller.js"));
const zod_util_js_1 = require("../../utils/zod.util.js");
const hiveSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(24).trim(),
    grouphive: zod_1.z.number().int().optional().default(0),
    position: zod_1.z.number().int().optional().default(0),
    note: zod_1.z.string().max(2000).optional(),
    modus: zod_1.z.boolean().optional(),
    modus_date: zod_1.z.string().optional(),
    deleted: zod_1.z.boolean().optional(),
});
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    server.get('/', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]) }, hive_controller_js_1.default.get);
    server.get('/:id', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]) }, hive_controller_js_1.default.getDetail);
    server.get('/task/:id', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            params: zod_1.z.object({
                id: zod_1.z.coerce.number(),
            }),
            querystring: zod_1.z.object({
                apiary: zod_util_js_1.booleanParamSchema.optional(),
                year: zod_1.z.coerce.number().optional(),
            }),
        },
    }, hive_controller_js_1.default.getTasks);
    server.patch('/', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
                data: hiveSchema.partial(),
            }),
        },
    }, hive_controller_js_1.default.patch);
    server.post('/', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        schema: {
            body: zod_1.z
                .object({
                apiary_id: zod_1.z.number(),
                start: zod_1.z.number().min(0).max(10000),
                repeat: zod_1.z.number().min(0).max(100),
                date: zod_1.z.string(),
            })
                .merge(hiveSchema),
        },
    }, hive_controller_js_1.default.post);
    server.patch('/batchDelete', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
            }),
        },
    }, hive_controller_js_1.default.batchDelete);
    server.post('/batchGet', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
            }),
        },
    }, hive_controller_js_1.default.batchGet);
    server.patch('/status', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
                status: zod_1.z.boolean(),
            }),
        },
    }, hive_controller_js_1.default.updateStatus);
    server.patch('/updatePosition', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                data: zod_1.z
                    .object({
                    id: zod_1.z.number(),
                    position: zod_1.z.number(),
                })
                    .array(),
            }),
        },
    }, hive_controller_js_1.default.updatePosition);
    done();
}
exports.default = routes;
