"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Promo = void 0;
const base_model_js_1 = require("./base.model.js");
const company_model_js_1 = require("./company.model.js");
class Promo extends base_model_js_1.BaseModel {
    id;
    code;
    months;
    date;
    used;
    user_id;
    static tableName = 'promos';
    static idColumn = 'id';
    company;
    static jsonSchema = {
        type: 'object',
        required: ['code'],
        properties: {
            id: { type: 'integer' },
            code: { type: 'string', minLength: 3, maxLength: 128 },
            months: { type: 'integer', maxLength: 11 },
            date: { type: 'string', format: 'date-time' },
            used: { type: 'boolean' },
            user_id: { type: 'integer' }, // Company FK
        },
    };
    static relationMappings = () => ({
        company: {
            relation: base_model_js_1.BaseModel.HasOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: ['promos.user_id'],
                to: ['company.id'],
            },
        },
    });
}
exports.Promo = Promo;
