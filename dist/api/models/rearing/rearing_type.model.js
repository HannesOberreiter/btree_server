"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RearingType = void 0;
const objection_1 = require("objection");
const company_model_js_1 = require("../company.model.js");
const rearing_detail_model_js_1 = require("./rearing_detail.model.js");
const rearing_step_model_js_1 = require("./rearing_step.model.js");
class RearingType extends objection_1.Model {
    id;
    name;
    note;
    user_id;
    company;
    detail;
    step;
    constructor() {
        super();
    }
    static tableName = 'rearing_types';
    static idColumn = 'id';
    static jsonSchema = {
        type: 'object',
        required: ['name'],
        properties: {
            id: { type: 'integer' },
            name: { type: 'string', minLength: 1, maxLength: 45 },
            note: { type: 'string', maxLength: 2000 },
            user_id: { type: 'integer' }, // Company FK
        },
    };
    static relationMappings = () => ({
        company: {
            relation: RearingType.HasOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: ['rearing_types.user_id'],
                to: ['companies.id'],
            },
        },
        step: {
            relation: RearingType.HasManyRelation,
            modelClass: rearing_step_model_js_1.RearingStep,
            join: {
                from: ['rearing_types.id'],
                to: ['rearing_steps.type_id'],
            },
        },
        detail: {
            relation: RearingType.ManyToManyRelation,
            modelClass: rearing_detail_model_js_1.RearingDetail,
            join: {
                from: 'rearing_types.id',
                through: {
                    modelClass: rearing_step_model_js_1.RearingStep,
                    from: 'rearing_steps.type_id',
                    to: 'rearing_steps.detail_id',
                },
                to: 'rearing_details.id',
            },
        },
    });
}
exports.RearingType = RearingType;
