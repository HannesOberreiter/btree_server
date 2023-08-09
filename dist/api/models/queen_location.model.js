"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueenLocation = void 0;
const objection_1 = require("objection");
const hive_model_js_1 = require("./hive.model.js");
const queen_model_js_1 = require("./queen.model.js");
class QueenLocation extends objection_1.Model {
    hive_id;
    hive_name;
    queen_id;
    queen_name;
    queen_move_date;
    queen_mark_colour;
    queen_modus;
    queen_modus_date;
    hive;
    queen;
    static tableName = 'queens_locations';
    static idColumn = 'queen_id';
    static jsonSchema = {};
    static relationMappings = () => ({
        hive: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: hive_model_js_1.Hive,
            join: {
                from: 'hives.id',
                to: 'queens_locations.hive_id',
            },
        },
        queen: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: queen_model_js_1.Queen,
            join: {
                from: 'queens.id',
                to: 'queens_locations.queen_id',
            },
        },
    });
}
exports.QueenLocation = QueenLocation;
