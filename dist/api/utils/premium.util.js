"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPremium = exports.limitScale = exports.limitApiary = exports.limitHive = exports.isPremium = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const error_util_js_1 = require("../utils/error.util.js");
const company_model_js_1 = require("../models/company.model.js");
const environment_config_js_1 = require("../../config/environment.config.js");
const hive_model_js_1 = require("../models/hive.model.js");
const apiary_model_js_1 = require("../models/apiary.model.js");
const scale_model_js_1 = require("../models/scale.model.js");
const payment_model_js_1 = require("../models/payment.model.js");
const isPremium = async (id) => {
    const paid = await company_model_js_1.Company.query()
        .select('paid')
        .findById(id)
        .throwIfNotFound();
    return paid.isPaid();
};
exports.isPremium = isPremium;
const limitHive = async (user_id, amount) => {
    try {
        const premium = await (0, exports.isPremium)(user_id);
        if ((amount > environment_config_js_1.basicLimit.hive && !premium) || amount > environment_config_js_1.totalLimit.hive)
            return true;
        const result = await hive_model_js_1.Hive.query()
            .count('id as count')
            .where({ user_id: user_id, deleted: false });
        if ((result[0]['count'] + amount > environment_config_js_1.basicLimit.hive && !premium) ||
            result[0]['count'] + amount > environment_config_js_1.totalLimit.hive) {
            return true;
        }
        else {
            return false;
        }
    }
    catch (e) {
        throw (0, error_util_js_1.checkMySQLError)(e);
    }
};
exports.limitHive = limitHive;
const limitApiary = async (user_id) => {
    try {
        const premium = await (0, exports.isPremium)(user_id);
        const result = await apiary_model_js_1.Apiary.query()
            .count('id as count')
            .where({ user_id: user_id, deleted: false });
        if ((result[0]['count'] + 1 > environment_config_js_1.basicLimit.apiary && !premium) ||
            result[0]['count'] + 1 > environment_config_js_1.totalLimit.apiary) {
            return true;
        }
        else {
            return false;
        }
    }
    catch (e) {
        throw (0, error_util_js_1.checkMySQLError)(e);
    }
};
exports.limitApiary = limitApiary;
const limitScale = async (user_id) => {
    try {
        const premium = await (0, exports.isPremium)(user_id);
        const result = await scale_model_js_1.Scale.query()
            .count('id as count')
            .where({ user_id: user_id });
        if ((result[0]['count'] + 1 > environment_config_js_1.basicLimit.scale && !premium) ||
            result[0]['count'] + 1 > environment_config_js_1.totalLimit.scale) {
            return true;
        }
        else {
            return false;
        }
    }
    catch (e) {
        throw (0, error_util_js_1.checkMySQLError)(e);
    }
};
exports.limitScale = limitScale;
const addPremium = async (user_id, months = 12, amount = 0, type) => {
    return await company_model_js_1.Company.transaction(async (trx) => {
        const company = await company_model_js_1.Company.query(trx).select('paid').findById(user_id);
        const newPaid = (0, dayjs_1.default)(company.paid) < (0, dayjs_1.default)()
            ? (0, dayjs_1.default)().add(months, 'month')
            : (0, dayjs_1.default)(company.paid).add(months, 'month');
        const result = await company_model_js_1.Company.query(trx).patchAndFetchById(user_id, {
            paid: newPaid.format('YYYY-MM-DD'),
        });
        await payment_model_js_1.Payment.query(trx).insert({
            date: new Date(),
            user_id: user_id,
            amount: amount ? amount : 0,
            type: type,
        });
        return result.paid;
    });
};
exports.addPremium = addPremium;
