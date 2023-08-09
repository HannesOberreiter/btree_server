"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RearingStep = void 0;
const objection_1 = require("objection");
const rearing_detail_model_js_1 = require("./rearing_detail.model.js");
const rearing_type_model_js_1 = require("./rearing_type.model.js");
class RearingStep extends objection_1.Model {
    id;
    type_id;
    detail_id;
    position;
    sleep_after;
    sleep_before;
    type;
    detail;
    static tableName = 'rearing_steps';
    static idColumn = 'id';
    static jsonSchema = {
        type: 'object',
        required: ['position'],
        properties: {
            id: { type: 'integer' },
            type_id: { type: 'integer' },
            detail_id: { type: 'integer' },
            position: { type: 'integer' },
            sleep_after: { type: 'integer', minimum: 0, maximum: 9000 },
            sleep_before: { type: 'integer', minimum: 0, maximum: 9000 }, // Sleep before in hours
        },
    };
    static get modifiers() {
        return {
            orderByPosition(builder) {
                builder.orderBy('position', 'asc');
            },
        };
    }
    static relationMappings = () => ({
        detail: {
            relation: RearingStep.BelongsToOneRelation,
            modelClass: rearing_detail_model_js_1.RearingDetail,
            join: {
                from: 'rearing_steps.detail_id',
                to: 'rearing_details.id',
            },
        },
        type: {
            relation: RearingStep.BelongsToOneRelation,
            modelClass: rearing_type_model_js_1.RearingType,
            join: {
                from: 'rearing_steps.type_id',
                to: 'rearing_types.id',
            },
        },
    });
}
exports.RearingStep = RearingStep;
