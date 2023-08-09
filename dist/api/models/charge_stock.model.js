"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChargeStock = void 0;
const base_model_js_1 = require("./base.model.js");
const company_model_js_1 = require("./company.model.js");
const charge_type_model_js_1 = require("./option/charge_type.model.js");
class ChargeStock extends base_model_js_1.BaseModel {
    sum_in;
    sum_out;
    sum;
    type_id;
    user_id;
    static tableName = 'charge_stocks';
    static idColumn = 'user_id';
    type;
    company;
    static jsonSchema = {};
    static relationMappings = () => ({
        type: {
            relation: base_model_js_1.BaseModel.HasOneRelation,
            modelClass: charge_type_model_js_1.ChargeType,
            join: {
                from: ['charge_stocks.type_id'],
                to: ['charge_types.id'],
            },
        },
        company: {
            relation: base_model_js_1.BaseModel.HasOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: ['charge_stocks.user_id'],
                to: ['company.id'],
            },
        },
    });
}
exports.ChargeStock = ChargeStock;
