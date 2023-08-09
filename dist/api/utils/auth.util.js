"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildUserAgent = exports.unsubscribeMail = exports.resetPassword = exports.resetMail = exports.confirmAccount = exports.createHashedPassword = void 0;
const crypto_1 = require("crypto");
const dayjs_1 = __importDefault(require("dayjs"));
const ua_parser_js_1 = require("ua-parser-js");
const error_util_js_1 = require("../utils/error.util.js");
const user_model_js_1 = require("../models/user.model.js");
const buildUserAgent = (req) => {
    try {
        const agent = (0, ua_parser_js_1.UAParser)(req.headers['user-agent']);
        const userAgentInsert = agent.os.name +
            agent.browser.name +
            agent.device.vendor +
            agent.device.model;
        return userAgentInsert.length > 65
            ? userAgentInsert.substring(0, 64)
            : userAgentInsert;
    }
    catch (e) {
        return 'noUserAgent';
    }
};
exports.buildUserAgent = buildUserAgent;
const createHashedPassword = (password, hash = 'sha512') => {
    // We first need to hash the inputPassword, this is due to an old code
    // in my first app I did hash the password on login page before sending to server
    const hexInputPassword = (0, crypto_1.createHash)(hash).update(password).digest('hex');
    const salt = (0, crypto_1.randomBytes)(40).toString('hex');
    const saltedPassword = hexInputPassword + salt;
    const hashedPassword = (0, crypto_1.createHash)(hash).update(saltedPassword).digest('hex');
    return { salt: salt, password: hashedPassword };
};
exports.createHashedPassword = createHashedPassword;
const confirmAccount = async (id) => {
    try {
        const u = await user_model_js_1.User.transaction(async (trx) => {
            const u = await user_model_js_1.User.query(trx).patchAndFetchById(id, {
                state: 1,
                reset: '',
            });
            return u.email;
        });
        return u;
    }
    catch (e) {
        throw (0, error_util_js_1.checkMySQLError)(e);
    }
};
exports.confirmAccount = confirmAccount;
const unsubscribeMail = async (id) => {
    try {
        const u = await user_model_js_1.User.transaction(async (trx) => {
            const u = await user_model_js_1.User.query(trx).patchAndFetchById(id, {
                newsletter: false,
            });
            return u.email;
        });
        return u;
    }
    catch (e) {
        throw (0, error_util_js_1.checkMySQLError)(e);
    }
};
exports.unsubscribeMail = unsubscribeMail;
const resetMail = async (id) => {
    try {
        const u = await user_model_js_1.User.transaction(async (trx) => {
            const u = await user_model_js_1.User.query(trx).patchAndFetchById(id, {
                reset: (0, crypto_1.randomBytes)(64).toString('hex'),
                reset_timestamp: (0, dayjs_1.default)().toDate(),
            });
            return u;
        });
        return u;
    }
    catch (e) {
        throw (0, error_util_js_1.checkMySQLError)(e);
    }
};
exports.resetMail = resetMail;
const resetPassword = async (id, inputPassword) => {
    const { salt, password } = createHashedPassword(inputPassword);
    try {
        const u = await user_model_js_1.User.transaction(async (trx) => {
            /*
            We also activate the account, this is so that we can tell our customers if they did not recive an
            activation email they can use the password reset function
            */
            const u = await user_model_js_1.User.query(trx).patchAndFetchById(id, {
                reset: '',
                state: 1,
                password: password,
                salt: salt,
            });
            return u;
        });
        return u;
    }
    catch (e) {
        throw (0, error_util_js_1.checkMySQLError)(e);
    }
};
exports.resetPassword = resetPassword;
