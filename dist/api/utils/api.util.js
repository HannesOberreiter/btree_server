"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidTimeZone = exports.getCompany = void 0;
const error_util_js_1 = require("./error.util.js");
const company_model_js_1 = require("../models/company.model.js");
const getCompany = async (api) => {
    try {
        return await company_model_js_1.Company.query().findOne({ api_key: api }).throwIfNotFound();
    }
    catch (e) {
        throw (0, error_util_js_1.checkMySQLError)(e);
    }
};
exports.getCompany = getCompany;
/**
 * https://stackoverflow.com/a/44118363/5316675
 * @param tz timezone string to test if valid
 * @returns Boolean
 * @error if environment does not support timezones it throws a new error
 */
function isValidTimeZone(tz) {
    if (!Intl || !Intl.DateTimeFormat().resolvedOptions().timeZone) {
        throw new Error('Time zones are not available in this environment');
    }
    try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.isValidTimeZone = isValidTimeZone;
