"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Charge = void 0;
const base_model_js_1 = require("./base.model.js");
const company_model_js_1 = require("./company.model.js");
const user_model_js_1 = require("./user.model.js");
const charge_type_model_js_1 = require("./option/charge_type.model.js");
class Charge extends base_model_js_1.ExtModel {
    id;
    name;
    charge;
    bestbefore;
    calibrate;
    amount;
    price;
    note;
    url;
    kind;
    deleted;
    deleted_at;
    user_id;
    edit_id;
    bee_id;
    static tableName = 'charges';
    static idColumn = 'id';
    type;
    company;
    creator;
    editor;
    static jsonSchema = {
        type: 'object',
        required: ['kind'],
        properties: {
            id: { type: 'integer' },
            name: { type: 'string', maxLength: 255 },
            charge: { type: 'string', maxLength: 255 },
            bestbefore: { type: 'string', format: 'date' },
            calibrate: { type: 'string', maxLength: 45 },
            amount: { type: 'number' },
            price: { type: 'number' },
            note: { type: 'string', maxLength: 2000 },
            url: { type: 'string', maxLength: 512 },
            kind: { type: 'string', maxLength: 45, enum: ['in', 'out'] },
            deleted: { type: 'boolean' },
            deleted_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            type_id: { type: 'integer' },
            user_id: { type: 'integer' },
            bee_id: { type: 'integer' },
            edit_id: { type: 'integer' }, // Updater Bee FK
        },
    };
    static relationMappings = () => ({
        type: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: charge_type_model_js_1.ChargeType,
            join: {
                from: ['charges.type_id'],
                to: ['charge_types.id'],
            },
        },
        company: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: ['charges.user_id'],
                to: ['company.id'],
            },
        },
        creator: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['charges.bee_id'],
                to: ['bees.id'],
            },
        },
        editor: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['charges.edit_id'],
                to: ['bees.id'],
            },
        },
    });
}
exports.Charge = Charge;
