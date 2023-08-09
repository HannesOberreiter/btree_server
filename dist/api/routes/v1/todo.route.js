"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const guard_middleware_js_1 = require("../../middlewares/guard.middleware.js");
const constants_config_js_1 = require("../../../config/constants.config.js");
const zod_1 = require("zod");
const todo_controller_js_1 = __importDefault(require("../../controllers/todo.controller.js"));
const zod_util_js_1 = require("../../utils/zod.util.js");
const schemaTodo = zod_1.z.object({
    name: zod_1.z.string().min(1).max(48).trim(),
    date: zod_1.z.string(),
    note: zod_1.z.string().max(2000).optional(),
    url: zod_1.z.string().max(512).optional(),
    done: zod_1.z.boolean().optional(),
});
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    server.get('/', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
    }, todo_controller_js_1.default.get);
    server.post('/', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z
                .object({
                interval: zod_1.z.number().min(0).max(365).optional(),
                repeat: zod_1.z.number().min(0).max(30).optional(),
            })
                .merge(schemaTodo),
        },
    }, todo_controller_js_1.default.post);
    server.patch('/', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
                data: schemaTodo.partial(),
            }),
        },
    }, todo_controller_js_1.default.patch);
    server.patch('/status', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
                status: zod_1.z.boolean(),
            }),
        },
    }, todo_controller_js_1.default.updateStatus);
    server.patch('/date', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
                start: zod_1.z.string(),
            }),
        },
    }, todo_controller_js_1.default.updateDate);
    server.patch('/batchDelete', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
            }),
        },
    }, todo_controller_js_1.default.batchDelete);
    server.post('/batchGet', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
            }),
        },
    }, todo_controller_js_1.default.batchGet);
    done();
}
exports.default = routes;
