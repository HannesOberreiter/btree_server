"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovedateCount = void 0;
const objection_1 = require("objection");
const hive_model_js_1 = require("./hive.model.js");
const movedate_model_js_1 = require("./movedate.model.js");
class MovedateCount extends objection_1.Model {
    hive_id;
    count;
    hive;
    movedate;
    static tableName = 'movedates_counts';
    static idColumn = 'hive_id';
    static jsonSchema = {
        type: 'object',
        required: ['date', 'apiary_id', 'hive_id'],
        properties: {
            hive_id: { type: 'integer' },
            count: { type: 'integer' },
        },
    };
    static relationMappings = () => ({
        hive: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: hive_model_js_1.Hive,
            join: {
                from: 'movedates_counts.hive_id',
                to: 'hives.id',
            },
        },
        movedate: {
            relation: objection_1.Model.HasManyRelation,
            modelClass: movedate_model_js_1.Movedate,
            join: {
                from: 'movedates_counts.hive_id',
                to: 'movedates.hive_id',
            },
        },
    });
}
exports.MovedateCount = MovedateCount;
