"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queen = void 0;
const base_model_js_1 = require("./base.model.js");
const user_model_js_1 = require("./user.model.js");
const queen_race_model_js_1 = require("./option/queen_race.model.js");
const queen_mating_model_js_1 = require("./option/queen_mating.model.js");
const company_model_js_1 = require("./company.model.js");
const queen_location_model_js_1 = require("./queen_location.model.js");
const hive_location_model_js_1 = require("./hive_location.model.js");
class Queen extends base_model_js_1.ExtModel {
    id;
    name;
    mark_colour;
    mother;
    date;
    move_date;
    note;
    url;
    modus;
    modus_date;
    deleted;
    deleted_at;
    bee_id;
    edit_id;
    mother_id;
    user_id;
    static tableName = 'queens';
    static idColumn = 'id';
    creator;
    editor;
    company;
    hive_location;
    race;
    mating;
    own_mother;
    queen_location;
    static jsonSchema = {
        type: 'object',
        required: ['name'],
        properties: {
            id: { type: 'integer' },
            name: { type: 'string', minLength: 1, maxLength: 24 },
            mark_colour: { type: 'string', maxLength: 24 },
            mother: { type: 'string', maxLength: 24 },
            date: { type: 'string', format: 'date' },
            move_date: { type: 'string', format: 'date' },
            url: { type: 'string', maxLength: 512 },
            note: { type: 'string', maxLength: 2000 },
            modus: { type: 'boolean' },
            modus_date: { type: 'string', format: 'date' },
            deleted: { type: 'boolean' },
            deleted_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            hive_id: { type: ['integer', 'null'] },
            race_id: { type: 'integer' },
            mating_id: { type: 'integer' },
            mother_id: { type: ['integer', 'null'] },
            user_id: { type: 'integer' },
            bee_id: { type: 'integer' },
            edit_id: { type: 'integer' }, // Updater Bee FK
        },
    };
    static relationMappings = () => ({
        creator: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['queens.bee_id'],
                to: ['bees.id'],
            },
        },
        editor: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['queens.edit_id'],
                to: ['bees.id'],
            },
        },
        hive_location: {
            relation: Queen.HasOneRelation,
            modelClass: hive_location_model_js_1.HiveLocation,
            join: {
                from: ['queens.hive_id'],
                to: ['hives_locations.hive_id'],
            },
        },
        queen_location: {
            relation: Queen.HasOneRelation,
            modelClass: queen_location_model_js_1.QueenLocation,
            join: {
                from: ['queens.id'],
                to: ['queens_locations.queen_id'],
            },
        },
        race: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: queen_race_model_js_1.QueenRace,
            join: {
                from: ['queens.race_id'],
                to: ['queen_races.id'],
            },
        },
        mating: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: queen_mating_model_js_1.QueenMating,
            join: {
                from: ['queens.mating_id'],
                to: ['queen_matings.id'],
            },
        },
        company: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: ['queens.user_id'],
                to: ['companies.id'],
            },
        },
        own_mother: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: Queen,
            join: {
                from: ['queens.mother_id'],
                to: ['queens.id'],
            },
        },
    });
}
exports.Queen = Queen;
