"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtModel = exports.BaseModel = void 0;
const objection_1 = require("objection");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AjvValidator = require('objection').AjvValidator;
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
dayjs_1.default.extend(utc_1.default);
class BaseModel extends objection_1.Model {
    constructor() {
        super();
    }
    // Fix to change date-time from ISOFormat to MySQL Format
    $beforeValidate(jsonSchema, json, _opt) {
        Object.keys(jsonSchema.properties).map(function (key, _index) {
            const format = jsonSchema.properties[key].format;
            if (format && typeof format !== 'undefined' && format === 'date-time') {
                const valueToValidate = json[key];
                if (valueToValidate !== null && valueToValidate instanceof Date) {
                    json[key] = valueToValidate
                        .toISOString()
                        .slice(0, 19)
                        .replace('T', ' ');
                }
                else if (valueToValidate) {
                    json[key] = new Date(valueToValidate)
                        .toISOString()
                        .slice(0, 19)
                        .replace('T', ' ');
                }
            }
        });
        return jsonSchema;
    }
    // Using formats package to evaluate json type formats
    // https://ajv.js.org/options.html#usage
    static createValidator() {
        return new AjvValidator({
            onCreateAjv: (ajv) => {
                (0, ajv_formats_1.default)(ajv);
            },
            options: {
                allErrors: true,
                validateSchema: true,
                ownProperties: true,
                v5: false,
            },
        });
    }
}
exports.BaseModel = BaseModel;
class ExtModel extends BaseModel {
    created_at;
    updated_at;
    // small helper to prevent error on timestamp if tables are joined
    // eg. ER_NON_UNIQ_ERROR: Column 'updated_at' in field list is ambiguous
    getTablename() {
        return this.constructor['tableName'];
    }
    constructor() {
        super();
    }
    // https://github.com/Vincit/objection.js/issues/647
    $beforeInsert() {
        this[`${this.getTablename()}.created_at`] = dayjs_1.default
            .utc()
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ');
        delete this.updated_at;
    }
    $beforeUpdate() {
        this[`${this.getTablename()}.updated_at`] = dayjs_1.default
            .utc()
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ');
        delete this.created_at;
    }
}
exports.ExtModel = ExtModel;
