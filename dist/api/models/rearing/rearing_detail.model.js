"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RearingDetail = void 0;
const objection_1 = require("objection");
const company_model_js_1 = require("../company.model.js");
const rearing_type_model_js_1 = require("./rearing_type.model.js");
const rearing_step_model_js_1 = require("./rearing_step.model.js");
class RearingDetail extends objection_1.Model {
    id;
    job;
    /**
     * @deprecated use sleep_before in rearing_steps table
     */
    hour;
    note;
    user_id;
    company;
    type;
    step;
    constructor() {
        super();
    }
    static get modifiers() {
        return {
            orderByPosition(builder) {
                builder.orderBy('rearing_steps.position', 'asc');
            },
        };
    }
    static tableName = 'rearing_details';
    static idColumn = 'id';
    static jsonSchema = {
        type: 'object',
        required: ['job'],
        properties: {
            id: { type: 'integer' },
            job: { type: 'string', minLength: 1, maxLength: 50 },
            hour: { type: 'integer' },
            note: { type: 'string', maxLength: 2000 },
            user_id: { type: 'integer' }, // Company FK
        },
    };
    static relationMappings = () => ({
        company: {
            relation: RearingDetail.HasOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: ['rearing_details.user_id'],
                to: ['companies.id'],
            },
        },
        step: {
            relation: RearingDetail.HasManyRelation,
            modelClass: rearing_step_model_js_1.RearingStep,
            join: {
                from: ['rearing_details.id'],
                to: ['rearing_steps.detail_id'],
            },
        },
        type: {
            relation: RearingDetail.ManyToManyRelation,
            modelClass: rearing_type_model_js_1.RearingType,
            join: {
                from: 'rearing_details.id',
                through: {
                    modelClass: rearing_step_model_js_1.RearingStep,
                    from: 'rearing_steps.detail_id',
                    to: 'rearing_steps.type_id',
                },
                to: 'rearing_types.id',
            },
        },
    });
}
exports.RearingDetail = RearingDetail;
