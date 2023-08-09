"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const guard_middleware_js_1 = require("../../middlewares/guard.middleware.js");
const constants_config_js_1 = require("../../../config/constants.config.js");
const zod_1 = require("zod");
const options_controller_js_1 = __importDefault(require("../../controllers/options.controller.js"));
const validator_middleware_js_1 = require("../../middlewares/validator.middleware.js");
const zod_util_js_1 = require("../../utils/zod.util.js");
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    server.get('/:table', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        preValidation: validator_middleware_js_1.Validator.handleOption,
    }, options_controller_js_1.default.get);
    server.patch('/:table', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        preValidation: validator_middleware_js_1.Validator.handleOption,
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
                data: zod_1.z.object({}).passthrough(),
            }),
        },
    }, options_controller_js_1.default.patch);
    server.post('/:table', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        preValidation: validator_middleware_js_1.Validator.handleOption,
    }, options_controller_js_1.default.post);
    server.patch('/:table/status', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        preValidation: validator_middleware_js_1.Validator.handleOption,
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
                status: zod_1.z.boolean(),
            }),
        },
    }, options_controller_js_1.default.updateStatus);
    server.patch('/:table/favorite', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        preValidation: validator_middleware_js_1.Validator.handleOption,
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
            }),
        },
    }, options_controller_js_1.default.updateFavorite);
    server.patch('/:table/batchDelete', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]),
        preValidation: validator_middleware_js_1.Validator.handleOption,
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
            }),
        },
    }, options_controller_js_1.default.batchDelete);
    server.post('/:table/batchGet', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user, constants_config_js_1.ROLES.read]),
        preValidation: validator_middleware_js_1.Validator.handleOption,
        schema: {
            body: zod_1.z.object({
                ids: zod_1.z.array(zod_util_js_1.numberSchema),
            }),
        },
    }, options_controller_js_1.default.batchGet);
    done();
}
exports.default = routes;
