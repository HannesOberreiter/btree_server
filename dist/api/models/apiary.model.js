"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Apiary = void 0;
const base_model_js_1 = require("./base.model.js");
const user_model_js_1 = require("./user.model.js");
const company_model_js_1 = require("./company.model.js");
const hive_count_model_js_1 = require("./hive_count.model.js");
class Apiary extends base_model_js_1.ExtModel {
    id;
    name;
    description;
    latitude;
    longitude;
    note;
    url;
    modus;
    deleted;
    deleted_at;
    user_id;
    bee_id;
    edit_id;
    static tableName = 'apiaries';
    static idColumn = 'id';
    company;
    creator;
    editor;
    hive_count;
    static jsonSchema = {
        $id: 'apiaries_schema',
        type: 'object',
        required: ['name'],
        properties: {
            id: { type: 'integer' },
            name: { type: 'string', minLength: 1, maxLength: 45 },
            description: { type: 'string', maxLength: 512 },
            latitude: { type: 'number', minimum: -90, maximum: 90, default: 0 },
            longitude: { type: 'number', minimum: -180, maximum: 180, default: 0 },
            note: { type: 'string', maxLength: 2000 },
            url: { type: 'string', maxLength: 512 },
            modus: { type: 'boolean' },
            deleted: { type: 'boolean' },
            deleted_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            user_id: { type: 'integer' },
            bee_id: { type: 'integer' },
            edit_id: { type: 'integer' }, // Updater Bee FK
        },
    };
    static relationMappings = () => ({
        company: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: ['apiaries.user_id'],
                to: ['companies.id'],
            },
        },
        hive_count: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: hive_count_model_js_1.HiveCount,
            join: {
                from: ['hives_counts.id'],
                to: ['apiaries.id'],
            },
        },
        creator: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['apiaries.bee_id'],
                to: ['bees.id'],
            },
        },
        editor: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['apiaries.edit_id'],
                to: ['bees.id'],
            },
        },
    });
}
exports.Apiary = Apiary;
