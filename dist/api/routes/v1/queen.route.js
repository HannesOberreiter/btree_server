"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const guard_middleware_js_1 = require("../../middlewares/guard.middleware.js");
const constants_config_js_1 = require("../../../config/constants.config.js");
const zod_1 = require("zod");
const validator_middleware_js_1 = require("../../middlewares/validator.middleware.js");
const queen_controller_js_1 = __importDefault(require("../../controllers/queen.controller.js"));
const zod_util_js_1 = require("../../utils/zod.util.js");
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    server.get('/', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
    }, queen_controller_js_1.default.get);
    server.get('/stats', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        preValidation: validator_middleware_js_1.Validator.isPremium,
    }, queen_controller_js_1.default.getStats);
    server.get('/pedigree/:id', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
    }, queen_controller_js_1.default.getPedigree);
    server.post('/', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z
                .object({
                start: zod_1.z.number().int().min(0).max(10000).optional(),
                repeat: zod_1.z.number().int().min(0).max(100).optional(),
            })
                .passthrough(),
        },
    }, queen_controller_js_1.default.post);
    server.patch('/', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
                data: zod_1.z.object({}).passthrough(),
            }),
        },
    }, queen_controller_js_1.default.patch);
    server.patch('/status', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
                status: zod_1.z.boolean(),
            }),
        },
    }, queen_controller_js_1.default.updateStatus);
    server.patch('/batchDelete', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
            }),
        },
    }, queen_controller_js_1.default.batchDelete);
    server.post('/batchGet', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
            }),
        },
    }, queen_controller_js_1.default.batchGet);
    done();
}
exports.default = routes;
