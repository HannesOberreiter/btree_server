"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HiveLocation = void 0;
const apiary_model_js_1 = require("./apiary.model.js");
const objection_1 = require("objection");
const hive_model_js_1 = require("./hive.model.js");
const movedate_model_js_1 = require("./movedate.model.js");
class HiveLocation extends objection_1.Model {
    apiary_id;
    user_id;
    move_id;
    apiary_name;
    hive_id;
    hive_name;
    hive_modus;
    hive_deleted;
    apiary;
    hive;
    movedate;
    static tableName = 'hives_locations';
    static idColumn = 'move_id';
    static jsonSchema = {};
    static relationMappings = () => ({
        apiary: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: apiary_model_js_1.Apiary,
            join: {
                from: 'apiaries.id',
                to: 'hives_locations.apiary_id',
            },
        },
        hive: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: hive_model_js_1.Hive,
            join: {
                from: 'hives.id',
                to: 'hives_locations.hive_id',
            },
        },
        movedate: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: movedate_model_js_1.Movedate,
            join: {
                from: 'movedates.id',
                to: 'hives_locations.move_id',
            },
        },
    });
}
exports.HiveLocation = HiveLocation;
