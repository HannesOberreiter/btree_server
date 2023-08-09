"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChargeType = void 0;
const baseoption_model_js_1 = require("./baseoption.model.js");
const charge_stock_model_js_1 = require("../charge_stock.model.js");
const company_model_js_1 = require("../company.model.js");
class ChargeType extends baseoption_model_js_1.BaseOptionModel {
    static tableName = 'charge_types';
    stock;
    constructor() {
        super();
        const newSchema = baseoption_model_js_1.BaseOptionModel.jsonSchema;
        newSchema.properties.unit = { type: 'string' };
        ChargeType.jsonSchema = newSchema;
    }
    static relationMappings = {
        company: {
            relation: ChargeType.HasOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: ['charge_types.user_id'],
                to: ['companies.id'],
            },
        },
        stock: {
            relation: ChargeType.HasOneRelation,
            modelClass: charge_stock_model_js_1.ChargeStock,
            join: {
                from: ['charge_types.id'],
                to: ['charge_stocks.type_id'],
            },
        },
    };
}
exports.ChargeType = ChargeType;
