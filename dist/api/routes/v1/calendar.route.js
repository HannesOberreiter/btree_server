"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const guard_middleware_js_1 = require("../../middlewares/guard.middleware.js");
const constants_config_js_1 = require("../../../config/constants.config.js");
const zod_1 = require("zod");
const calendar_controller_js_1 = __importDefault(require("../../controllers/calendar.controller.js"));
const CalendarParams = zod_1.z.object({
    start: zod_1.z.string(),
    end: zod_1.z.string(),
});
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    server.get('/checkup', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            querystring: CalendarParams,
        },
    }, calendar_controller_js_1.default.getCheckups);
    server.get('/treatment', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            querystring: CalendarParams,
        },
    }, calendar_controller_js_1.default.getTreatments);
    server.get('/harvest', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            querystring: CalendarParams,
        },
    }, calendar_controller_js_1.default.getHarvests);
    server.get('/feed', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            querystring: CalendarParams,
        },
    }, calendar_controller_js_1.default.getFeeds);
    server.get('/movedate', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            querystring: CalendarParams,
        },
    }, calendar_controller_js_1.default.getMovements);
    server.get('/todo', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            querystring: CalendarParams,
        },
    }, calendar_controller_js_1.default.getTodos);
    server.get('/scale_data', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            querystring: CalendarParams,
        },
    }, calendar_controller_js_1.default.getScaleData);
    server.get('/rearing', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            querystring: zod_1.z
                .object({
                start: zod_1.z.string().optional(),
                end: zod_1.z.string().optional(),
                id: zod_1.z.string().optional(),
            })
                .refine((val) => {
                if (val.start && val.end)
                    return true;
                if (val.id)
                    return true;
                return false;
            }),
        },
    }, calendar_controller_js_1.default.getRearings);
    done();
}
exports.default = routes;
