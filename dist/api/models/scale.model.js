"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scale = void 0;
const objection_1 = require("objection");
const company_model_js_1 = require("./company.model.js");
const hive_model_js_1 = require("./hive.model.js");
const scale_data_model_js_1 = require("./scale_data.model.js");
class Scale extends objection_1.Model {
    id;
    name;
    hive_id;
    user_id;
    hive;
    company;
    scale_data;
    static tableName = 'scales';
    static idColumn = 'id';
    static jsonSchema = {
        type: 'object',
        required: ['name'],
        properties: {
            name: { type: 'string', minLength: 1, maxLength: 45 },
            hive_id: { type: ['integer', 'null'] },
            user_id: { type: 'integer' },
        },
    };
    static relationMappings = () => ({
        scale_data: {
            relation: objection_1.Model.HasManyRelation,
            modelClass: scale_data_model_js_1.ScaleData,
            join: {
                from: 'scales.id',
                to: 'scale_data.scale_id',
            },
        },
        hive: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: hive_model_js_1.Hive,
            join: {
                from: 'scales.hive_id',
                to: 'hives.id',
            },
        },
        company: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: 'scales.user_id',
                to: 'companies.id',
            },
        },
    });
}
exports.Scale = Scale;
