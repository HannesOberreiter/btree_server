"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HiveCount = void 0;
const apiary_model_js_1 = require("./apiary.model.js");
const objection_1 = require("objection");
class HiveCount extends objection_1.Model {
    id;
    apiary_name;
    count;
    grouphivescount;
    apiary;
    static tableName = 'hives_counts';
    static idColumn = 'id';
    static jsonSchema = {};
    static relationMappings = () => ({
        apiary: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: apiary_model_js_1.Apiary,
            join: {
                from: 'apiaries.id',
                to: 'hives_counts.id',
            },
        },
    });
}
exports.HiveCount = HiveCount;
