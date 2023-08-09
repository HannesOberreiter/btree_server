"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hive = void 0;
const base_model_js_1 = require("./base.model.js");
const user_model_js_1 = require("./user.model.js");
const apiary_model_js_1 = require("./apiary.model.js");
const movedate_model_js_1 = require("./movedate.model.js");
const hive_location_model_js_1 = require("./hive_location.model.js");
const hive_type_mode_js_1 = require("./option/hive_type.mode.js");
const hive_source_model_js_1 = require("./option/hive_source.model.js");
const queen_location_model_js_1 = require("./queen_location.model.js");
const queen_model_js_1 = require("./queen.model.js");
const company_model_js_1 = require("./company.model.js");
class Hive extends base_model_js_1.ExtModel {
    id;
    name;
    grouphive;
    position;
    note;
    url;
    modus;
    modus_date;
    deleted_at;
    deleted;
    user_id;
    bee_id;
    edit_id;
    static tableName = 'hives';
    static idColumn = 'id';
    creator;
    editor;
    company;
    movedates;
    apiares;
    queens;
    hive_location;
    hive_type;
    hive_source;
    queen_location;
    static jsonSchema = {
        type: 'object',
        required: ['name'],
        properties: {
            id: { type: 'integer' },
            name: { type: 'string', minLength: 1, maxLength: 24 },
            grouphive: { type: 'integer' },
            position: { type: 'integer' },
            note: { type: 'string', maxLength: 2000 },
            modus: { type: 'boolean' },
            modus_date: { type: 'string', format: 'date' },
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
        creator: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['hives.bee_id'],
                to: ['bees.id'],
            },
        },
        editor: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['hives.edit_id'],
                to: ['bees.id'],
            },
        },
        hive_location: {
            relation: Hive.HasOneRelation,
            modelClass: hive_location_model_js_1.HiveLocation,
            join: {
                from: ['hives.id'],
                to: ['hives_locations.hive_id'],
            },
        },
        queen_location: {
            relation: Hive.HasOneRelation,
            modelClass: queen_location_model_js_1.QueenLocation,
            join: {
                from: ['hives.id'],
                to: ['queens_locations.hive_id'],
            },
        },
        hive_type: {
            relation: Hive.HasOneRelation,
            modelClass: hive_type_mode_js_1.HiveType,
            join: {
                from: ['hives.type_id'],
                to: ['hive_types.id'],
            },
        },
        hive_source: {
            relation: Hive.HasOneRelation,
            modelClass: hive_source_model_js_1.HiveSource,
            join: {
                from: ['hives.source_id'],
                to: ['hive_sources.id'],
            },
        },
        movedates: {
            relation: Hive.HasManyRelation,
            modelClass: movedate_model_js_1.Movedate,
            join: {
                from: ['hives.id'],
                to: ['movedates.hive_id'],
            },
        },
        queens: {
            relation: Hive.HasManyRelation,
            modelClass: queen_model_js_1.Queen,
            join: {
                from: ['hives.id'],
                to: ['queens.hive_id'],
            },
        },
        company: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: ['hives.user_id'],
                to: ['companies.id'],
            },
        },
        apiaries: {
            relation: Hive.ManyToManyRelation,
            modelClass: apiary_model_js_1.Apiary,
            join: {
                from: 'hives.id',
                through: {
                    modelClass: movedate_model_js_1.Movedate,
                    from: 'movedates.hive_id',
                    to: 'movedates.apiary_id',
                },
                to: 'apiaries.id',
            },
        },
    });
}
exports.Hive = Hive;
