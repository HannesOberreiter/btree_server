"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Guard = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const constants_config_js_1 = require("../../config/constants.config.js");
const enum_util_js_1 = require("../utils/enum.util.js");
class Guard {
    static authorize = (roles = (0, enum_util_js_1.listNumber)(constants_config_js_1.ROLES)) => (req, res, done) => Guard.handleSession(req, res, done, roles);
    static handleSession = (req, reply, done, roles) => {
        let error;
        if (!req.session.user) {
            throw http_errors_1.default.Unauthorized('Unauthorized');
        }
        else if (roles.length === 1 &&
            roles[0] === constants_config_js_1.ROLES.admin &&
            req.session.user.rank !== constants_config_js_1.ROLES.admin) {
            throw http_errors_1.default.Forbidden('Forbidden area');
        }
        else if (!roles.includes(req.session.user.rank)) {
            throw http_errors_1.default.Forbidden('Forbidden area');
        }
        done(error);
    };
}
exports.Guard = Guard;
