"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaidRank = exports.fetchUser = exports.reviewPassword = exports.loginCheck = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const crypto_1 = require("crypto");
const http_errors_1 = __importDefault(require("http-errors"));
const user_model_js_1 = require("../models/user.model.js");
const login_attempt_model_js_1 = require("../models/login_attempt.model.js");
const error_util_js_1 = require("./error.util.js");
const app_bootstrap_js_1 = require("../../app.bootstrap.js");
const company_bee_model_js_1 = require("../models/company_bee.model.js");
const insertWrongPasswordTry = async (bee_id) => {
    const trx = await login_attempt_model_js_1.LoginAttemp.startTransaction();
    try {
        const now = (0, dayjs_1.default)().utc().toISOString();
        await login_attempt_model_js_1.LoginAttemp.query(trx).insert({
            time: now,
            bee_id: bee_id,
        });
        await trx.commit();
    }
    catch (e) {
        throw (0, error_util_js_1.checkMySQLError)(e);
    }
};
const updateLastLogin = async (bee_id) => {
    const trx = await user_model_js_1.User.startTransaction();
    try {
        const now = new Date();
        await user_model_js_1.User.query(trx).findById(bee_id).patch({
            last_visit: now,
        });
        await trx.commit();
    }
    catch (e) {
        throw (0, error_util_js_1.checkMySQLError)(e);
    }
};
const fetchUser = async (email, bee_id = 0) => {
    try {
        const user = user_model_js_1.User.query()
            .select('id', 'email', 'saved_company', 'username', 'password', 'salt', 'username', 'state', 'lang', 'format', 'sound', 'todo', 'acdate', 'newsletter')
            .withGraphFetched('company(cm)')
            .modifiers({
            cm(builder) {
                builder.select('companies.id', 'companies.name', 'companies.paid', 'companies.api_active', 'company_bee.rank');
            },
        })
            .first();
        if (bee_id === 0) {
            user.findOne({
                'bees.email': email,
            });
        }
        else {
            user.findOne({ 'bees.id': bee_id });
        }
        return await user;
    }
    catch (e) {
        throw (0, error_util_js_1.checkMySQLError)(e);
    }
};
exports.fetchUser = fetchUser;
const checkBruteForce = async (bee_id) => {
    try {
        // All login attempts are counted from the past 2 hours.
        const validAttempts = (0, dayjs_1.default)().subtract(2, 'hour').utc().toISOString();
        const bruteForce = await login_attempt_model_js_1.LoginAttemp.query()
            .count('id as count')
            .where('bee_id', bee_id)
            .where('time', '>', validAttempts)
            .orderBy('time');
        // ToDo send user E-Mail that the account is bruteForced
        if (bruteForce[0]['count'] < 10) {
            return false;
        }
        else {
            const lastNotice = (0, dayjs_1.default)().subtract(1, 'day').format('YYYY-MM-DD');
            const user = await user_model_js_1.User.query()
                .findById(bee_id)
                .where((builder) => builder
                .where('notice_bruteforce', '<', lastNotice)
                .orWhereNull('notice_bruteforce'));
            if (user) {
                app_bootstrap_js_1.MailServer.sendMail({
                    to: user.email,
                    lang: user.lang,
                    subject: 'acc_locked',
                    name: user.username,
                });
                await user_model_js_1.User.query()
                    .patch({ notice_bruteforce: new Date() })
                    .findById(user.id);
            }
            return true;
        }
    }
    catch (e) {
        throw (0, error_util_js_1.checkMySQLError)(e);
    }
};
const checkPassword = (inputPassword, dbPassword, salt, hash = 'sha512') => {
    // We first need to hash the inputPassword, this is due to an old code
    // in my first app I did hash the password on login page before sending to server
    const hexInputPassword = (0, crypto_1.createHash)(hash).update(inputPassword).digest('hex');
    const saltedPassword = hexInputPassword + salt;
    const hashedPassword = (0, crypto_1.createHash)(hash).update(saltedPassword).digest('hex');
    if (hashedPassword == dbPassword) {
        return true;
    }
    else {
        return false;
    }
};
const reviewPassword = async (bee_id, password) => {
    const user = await user_model_js_1.User.query().select('salt', 'password').findById(bee_id);
    if (!checkPassword(password, user.password, user.salt)) {
        throw http_errors_1.default.Forbidden('Wrong password');
    }
    return true;
};
exports.reviewPassword = reviewPassword;
const loginCheck = async (email, password, bee_id = undefined) => {
    let user;
    if (!bee_id) {
        user = await fetchUser(email);
    }
    else {
        user = await fetchUser('', bee_id);
    }
    if (!user) {
        throw http_errors_1.default.Forbidden('No User');
    }
    if (user.state !== 1) {
        throw http_errors_1.default.Unauthorized('Inactive account');
    }
    const bruteForce = await checkBruteForce(user.id);
    if (bruteForce) {
        throw http_errors_1.default.Locked('too many login attempts');
    }
    // Safety check if there is any connected company to the given user
    if (!user.company) {
        throw http_errors_1.default.Unauthorized('no company');
    }
    if (user.company.length < 1) {
        throw http_errors_1.default.Unauthorized('no company');
    }
    // Check if connected company exists (last visited company)
    // otherwise take the simply the first one
    let company;
    if (user.company.some((el) => el.id === user.saved_company)) {
        company = user.saved_company;
    }
    else {
        company = user.company[0].id;
    }
    const { rank, paid } = await getPaidRank(user.id, company);
    if (!bee_id) {
        if (!checkPassword(password, user.password, user.salt)) {
            await insertWrongPasswordTry(user.id);
            throw http_errors_1.default.Forbidden('Invalid password');
        }
    }
    await updateLastLogin(user.id);
    return {
        bee_id: user.id,
        user_id: company,
        data: user,
        paid: paid,
        rank: rank,
    };
};
exports.loginCheck = loginCheck;
const getPaidRank = async (bee_id, user_id) => {
    const companyBee = await company_bee_model_js_1.CompanyBee.query()
        .findOne({
        bee_id: bee_id,
        user_id: user_id,
    })
        .withGraphJoined('company');
    if (!companyBee) {
        // User could be removed from company
        throw http_errors_1.default.Unauthorized('Invalid Company / Bee Connection');
    }
    return { rank: companyBee.rank, paid: companyBee.company.isPaid() };
};
exports.getPaidRank = getPaidRank;
