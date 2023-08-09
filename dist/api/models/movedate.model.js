"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Movedate = void 0;
const base_model_js_1 = require("./base.model.js");
const user_model_js_1 = require("./user.model.js");
const objection_1 = require("objection");
const apiary_model_js_1 = require("./apiary.model.js");
const hive_model_js_1 = require("./hive.model.js");
const movedate_count_model_js_1 = require("./movedate_count.model.js");
class Movedate extends base_model_js_1.ExtModel {
    id;
    date;
    apiary_id;
    hive_id;
    edit_id;
    bee_id;
    apiary;
    hive;
    creator;
    editor;
    movedate_count;
    static tableName = 'movedates';
    static idColumn = 'id';
    static jsonSchema = {
        type: 'object',
        required: ['date', 'apiary_id', 'hive_id'],
        properties: {
            id: { type: 'integer' },
            date: { type: 'string', format: 'date' },
            edit_id: { type: 'integer' },
            apiary_id: { type: 'integer' },
            hive_id: { type: 'integer' }, // Hive FK
        },
    };
    static relationMappings = () => ({
        apiary: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: apiary_model_js_1.Apiary,
            join: {
                from: 'movedates.apiary_id',
                to: 'apiaries.id',
            },
        },
        hive: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: hive_model_js_1.Hive,
            join: {
                from: 'movedates.hive_id',
                to: 'hives.id',
            },
        },
        movedate_count: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: movedate_count_model_js_1.MovedateCount,
            join: {
                from: 'movedates.hive_id',
                to: 'movedates_counts.hive_id',
            },
        },
        creator: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['movedates.bee_id'],
                to: ['bees.id'],
            },
        },
        editor: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['movedates.edit_id'],
                to: ['bees.id'],
            },
        },
    });
}
exports.Movedate = Movedate;
