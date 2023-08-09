"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const guard_middleware_js_1 = require("../../middlewares/guard.middleware.js");
const constants_config_js_1 = require("../../../config/constants.config.js");
const zod_1 = require("zod");
const field_setting_controller_js_1 = __importDefault(require("../../controllers/field_setting.controller.js"));
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    server.get('/', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]) }, field_setting_controller_js_1.default.get);
    server.patch('/', {
        preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.read, constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]),
        schema: {
            body: zod_1.z.object({
                settings: zod_1.z.custom((data) => {
                    try {
                        JSON.parse(data);
                    }
                    catch (error) {
                        return false;
                    }
                    return true;
                }, 'invalid json'),
            }),
        },
    }, field_setting_controller_js_1.default.patch);
    done();
}
exports.default = routes;
