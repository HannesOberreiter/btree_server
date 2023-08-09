"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScaleData = void 0;
const base_model_js_1 = require("./base.model.js");
const scale_model_js_1 = require("./scale.model.js");
class ScaleData extends base_model_js_1.BaseModel {
    id;
    datetime;
    weight;
    temp1;
    temp2;
    rain;
    humidity;
    note;
    scale_id;
    scale;
    static tableName = 'scale_data';
    static idColumn = 'id';
    static jsonSchema = {
        type: 'object',
        required: ['scale_id', 'datetime'],
        properties: {
            datetime: { type: 'string', format: 'date-time' },
            weight: { type: 'number' },
            temp1: { type: 'number' },
            temp2: { type: 'number' },
            rain: { type: 'number' },
            humidity: { type: 'number' },
            note: { type: 'string', maxLength: 300 },
            scale_id: { type: 'integer' },
        },
    };
    static relationMappings = () => ({
        scale: {
            relation: base_model_js_1.BaseModel.BelongsToOneRelation,
            modelClass: scale_model_js_1.Scale,
            join: {
                from: 'scale_data.scale_id',
                to: 'scales.id',
            },
        },
    });
}
exports.ScaleData = ScaleData;
