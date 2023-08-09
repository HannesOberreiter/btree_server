"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueenDuration = void 0;
const objection_1 = require("objection");
const hive_model_js_1 = require("./hive.model.js");
const hive_location_model_js_1 = require("./hive_location.model.js");
const queen_model_js_1 = require("./queen.model.js");
class QueenDuration extends objection_1.Model {
    hive_id;
    id;
    user_id;
    move_date;
    last_date;
    duration;
    hive;
    queen;
    hive_location;
    static tableName = 'queen_durations';
    static idColumn = 'id';
    static jsonSchema = {};
    static relationMappings = () => ({
        hive: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: hive_model_js_1.Hive,
            join: {
                from: 'hives.id',
                to: 'queen_durations.hive_id',
            },
        },
        hive_location: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: hive_location_model_js_1.HiveLocation,
            join: {
                from: 'hives_locations.hive_id',
                to: 'queen_durations.hive_id',
            },
        },
        queen: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: queen_model_js_1.Queen,
            join: {
                from: 'queens.id',
                to: 'queen_durations.id',
            },
        },
    });
}
exports.QueenDuration = QueenDuration;
