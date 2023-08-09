"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const constants_config_js_1 = require("../../config/constants.config.js");
const premium_util_js_1 = require("../utils/premium.util.js");
class Validator {
    static handleOption = (req, reply, done) => {
        const params = req.params;
        if (!(params.table in constants_config_js_1.OPTION)) {
            throw new http_errors_1.default.NotFound();
        }
        done();
    };
    static handleSource = (req, reply, done) => {
        const params = req.params;
        if (!(params.source in constants_config_js_1.SOURCE)) {
            throw http_errors_1.default.NotFound();
        }
        done();
    };
    static isPremium = async (req, reply) => {
        if (!req.session.user) {
            throw http_errors_1.default.Unauthorized();
        }
        const premium = await (0, premium_util_js_1.isPremium)(req.session.user.user_id).catch((_err) => {
            throw http_errors_1.default.PaymentRequired();
        });
        if (!premium) {
            throw http_errors_1.default.PaymentRequired();
        }
        return;
    };
}
exports.Validator = Validator;
