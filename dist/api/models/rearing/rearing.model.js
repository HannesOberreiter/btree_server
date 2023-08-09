"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rearing = void 0;
const company_model_js_1 = require("../company.model.js");
const base_model_js_1 = require("../base.model.js");
const rearing_detail_model_js_1 = require("./rearing_detail.model.js");
const rearing_type_model_js_1 = require("./rearing_type.model.js");
const rearing_step_model_js_1 = require("./rearing_step.model.js");
class Rearing extends base_model_js_1.ExtModel {
    id;
    name;
    symbol;
    larvae;
    hatch;
    mated;
    note;
    date;
    type_id;
    detail_id;
    user_id;
    edit_id;
    bee_id;
    company;
    start;
    type;
    step;
    constructor() {
        super();
    }
    static tableName = 'rearings';
    static idColumn = 'id';
    static jsonSchema = {
        type: 'object',
        required: [],
        properties: {
            id: { type: 'integer' },
            name: { type: 'string', maxLength: 24 },
            symbol: { type: 'string', maxLength: 24 },
            larvae: { type: 'integer' },
            hatch: { type: 'integer' },
            mated: { type: 'integer' },
            date: { type: 'string', format: 'date-time' },
            note: { type: 'string', maxLength: 2000 },
            type_id: { type: 'integer' },
            detail_id: { type: 'integer' },
            user_id: { type: 'integer' },
        },
    };
    static relationMappings = () => ({
        company: {
            relation: Rearing.HasOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: ['rearings.user_id'],
                to: ['companies.id'],
            },
        },
        start: {
            relation: Rearing.HasOneRelation,
            modelClass: rearing_detail_model_js_1.RearingDetail,
            join: {
                from: ['rearings.detail_id'],
                to: ['rearing_details.id'],
            },
        },
        type: {
            relation: Rearing.HasOneRelation,
            modelClass: rearing_type_model_js_1.RearingType,
            join: {
                from: ['rearings.type_id'],
                to: ['rearing_types.id'],
            },
        },
        step: {
            relation: Rearing.HasManyRelation,
            modelClass: rearing_step_model_js_1.RearingStep,
            join: {
                from: ['rearings.type_id'],
                to: ['rearing_steps.type_id'],
            },
        },
    });
}
exports.Rearing = Rearing;
