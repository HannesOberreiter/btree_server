"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const guard_middleware_js_1 = require("../../middlewares/guard.middleware.js");
const constants_config_js_1 = require("../../../config/constants.config.js");
const dropbox_controller_js_1 = __importDefault(require("../../controllers/dropbox.controller.js"));
function routes(instance, _options, done) {
    const server = instance.withTypeProvider();
    server.get('/', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]) }, dropbox_controller_js_1.default.get);
    server.delete('/:id?', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]) }, dropbox_controller_js_1.default.delete);
    server.get('/auth/:code', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin]) }, dropbox_controller_js_1.default.auth);
    server.get('/token', { preHandler: guard_middleware_js_1.Guard.authorize([constants_config_js_1.ROLES.admin, constants_config_js_1.ROLES.user]) }, dropbox_controller_js_1.default.token);
    done();
}
exports.default = routes;
