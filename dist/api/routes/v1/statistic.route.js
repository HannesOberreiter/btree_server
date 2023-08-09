"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const guard_middleware_js_1 = require("../../middlewares/guard.middleware.js");
const constants_config_js_1 = require("../../../config/constants.config.js");
const zod_1 = require("zod");
const statistic_controller_js_1 = __importDefault(require("../../controllers/statistic.controller.js"));
const validator_middleware_js_1 = require("../../middlewares/validator.middleware.js");
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    server.get('/hive_count_total', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        preValidation: validator_middleware_js_1.Validator.isPremium,
    }, statistic_controller_js_1.default.getHiveCountTotal);
    server.get('/hive_count_apiary', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        preValidation: validator_middleware_js_1.Validator.isPremium,
        schema: {
            querystring: zod_1.z.object({
                date: zod_1.z.string(),
            }),
        },
    }, statistic_controller_js_1.default.getHiveCountApiary);
    server.get('/harvest/hive', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        preValidation: validator_middleware_js_1.Validator.isPremium,
    }, statistic_controller_js_1.default.getHarvestHive);
    server.get('/harvest/year', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        preValidation: validator_middleware_js_1.Validator.isPremium,
    }, statistic_controller_js_1.default.getHarvestYear);
    server.get('/harvest/apiary', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        preValidation: validator_middleware_js_1.Validator.isPremium,
    }, statistic_controller_js_1.default.getHarvestApiary);
    server.get('/harvest/type', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        preValidation: validator_middleware_js_1.Validator.isPremium,
    }, statistic_controller_js_1.default.getHarvestType);
    server.get('/feed/hive', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        preValidation: validator_middleware_js_1.Validator.isPremium,
    }, statistic_controller_js_1.default.getFeedHive);
    server.get('/feed/year', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        preValidation: validator_middleware_js_1.Validator.isPremium,
    }, statistic_controller_js_1.default.getFeedYear);
    server.get('/feed/apiary', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        preValidation: validator_middleware_js_1.Validator.isPremium,
    }, statistic_controller_js_1.default.getFeedApiary);
    server.get('/feed/type', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        preValidation: validator_middleware_js_1.Validator.isPremium,
    }, statistic_controller_js_1.default.getFeedType);
    server.get('/treatment/hive', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        preValidation: validator_middleware_js_1.Validator.isPremium,
    }, statistic_controller_js_1.default.getTreatmentHive);
    server.get('/treatment/year', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        preValidation: validator_middleware_js_1.Validator.isPremium,
    }, statistic_controller_js_1.default.getTreatmentYear);
    server.get('/treatment/apiary', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        preValidation: validator_middleware_js_1.Validator.isPremium,
    }, statistic_controller_js_1.default.getTreatmentApiary);
    server.get('/treatment/type', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        preValidation: validator_middleware_js_1.Validator.isPremium,
    }, statistic_controller_js_1.default.getTreatmentType);
    server.get('/rating/hive', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        preValidation: validator_middleware_js_1.Validator.isPremium,
    }, statistic_controller_js_1.default.getCheckupRatingHive);
    done();
}
exports.default = routes;
