"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Company = void 0;
const base_model_js_1 = require("./base.model.js");
const user_model_js_1 = require("./user.model.js");
const company_bee_model_js_1 = require("./company_bee.model.js");
const dayjs_1 = __importDefault(require("dayjs"));
class Company extends base_model_js_1.ExtModel {
    id;
    name;
    image;
    paid;
    api_active;
    api_key;
    static tableName = 'companies';
    static idColumn = 'id';
    user;
    isPaid() {
        return (0, dayjs_1.default)(this.paid) > (0, dayjs_1.default)();
    }
    static jsonSchema = {
        type: 'object',
        required: ['name'],
        properties: {
            id: { type: 'integer' },
            name: { type: 'string', minLength: 3, maxLength: 45 },
            paid: { type: 'string', format: 'date' },
            image: { type: 'string', minLength: 1, maxLength: 65 },
            api_active: { type: 'boolean' },
            api_key: { type: 'string', minLength: 1, maxLength: 65 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
        },
    };
    // Omit fields for json response from model
    $formatJson(company) {
        super.$formatJson(company);
        delete company.image;
        return company;
    }
    static relationMappings = () => ({
        user: {
            relation: base_model_js_1.ExtModel.ManyToManyRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: 'companies.id',
                through: {
                    modelClass: company_bee_model_js_1.CompanyBee,
                    from: 'company_bee.user_id',
                    to: 'company_bee.bee_id',
                },
                to: 'bees.id',
            },
        },
    });
}
exports.Company = Company;
