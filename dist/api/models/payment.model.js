"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const base_model_js_1 = require("./base.model.js");
const company_model_js_1 = require("./company.model.js");
class Payment extends base_model_js_1.BaseModel {
    id;
    type;
    amount;
    date;
    user_id;
    static tableName = 'payments';
    static idColumn = 'id';
    company;
    static jsonSchema = {
        type: 'object',
        properties: {
            id: { type: 'integer' },
            type: { type: 'string', minLength: 0, maxLength: 45 },
            amount: { type: 'number' },
            date: { type: 'string', format: 'date-time' },
            user_id: { type: 'integer' }, // Company FK
        },
    };
    static relationMappings = () => ({
        company: {
            relation: base_model_js_1.BaseModel.HasOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: ['payments.user_id'],
                to: ['company.id'],
            },
        },
    });
}
exports.Payment = Payment;
