"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Checkup = void 0;
const base_model_js_1 = require("./base.model.js");
const hive_model_js_1 = require("./hive.model.js");
const user_model_js_1 = require("./user.model.js");
const checkup_type_model_js_1 = require("./option/checkup_type.model.js");
const checkup_apiary_model_js_1 = require("./checkup_apiary.model.js");
class Checkup extends base_model_js_1.ExtModel {
    id;
    date;
    enddate;
    queen;
    queencells;
    eggs;
    capped_brood;
    brood;
    pollen;
    comb;
    temper;
    calm_comb;
    swarm;
    varroa;
    strong;
    temperature;
    weight;
    time;
    broodframes;
    honeyframes;
    foundation;
    emptyframes;
    note;
    url;
    done;
    deleted;
    user_id;
    edit_id;
    bee_id;
    hive_id;
    static tableName = 'checkups';
    static idColumn = 'id';
    type;
    hive;
    checkup_apiary;
    creator;
    editor;
    static jsonSchema = {
        type: 'object',
        required: ['date', 'hive_id'],
        properties: {
            id: { type: 'integer' },
            date: { type: 'string', format: 'date' },
            enddate: { type: 'string', format: 'date' },
            queen: { type: 'boolean' },
            queencells: { type: 'boolean' },
            eggs: { type: 'boolean' },
            capped_brood: { type: 'boolean' },
            brood: { type: 'number' },
            pollen: { type: 'number' },
            comb: { type: 'number' },
            temper: { type: 'number' },
            calm_comb: { type: 'number' },
            swarm: { type: 'number' },
            varroa: { type: 'number' },
            strong: { type: 'integer' },
            temperature: { type: 'number' },
            weight: { type: 'number' },
            time: { type: 'string', format: 'time' },
            broodframes: { type: 'integer' },
            honeyframes: { type: 'integer' },
            foundation: { type: 'integer' },
            emptyframes: { type: 'integer' },
            note: { type: 'string', maxLength: 2000 },
            url: { type: 'string', maxLength: 512 },
            done: { type: 'boolean' },
            deleted: { type: 'boolean' },
            deleted_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            user_id: { type: 'integer' },
            hive_id: { type: 'integer' },
            type_id: { type: 'integer' },
            bee_id: { type: 'integer' },
            edit_id: { type: 'integer' }, // Updater Bee FK
        },
    };
    static relationMappings = () => ({
        type: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: checkup_type_model_js_1.CheckupType,
            join: {
                from: ['checkups.type_id'],
                to: ['checkup_types.id'],
            },
        },
        hive: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: hive_model_js_1.Hive,
            join: {
                from: ['checkups.hive_id'],
                to: ['hives.id'],
            },
        },
        checkup_apiary: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: checkup_apiary_model_js_1.CheckupApiary,
            join: {
                from: ['checkups_apiaries.checkup_id'],
                to: ['checkups.id'],
            },
        },
        creator: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['checkups.bee_id'],
                to: ['bees.id'],
            },
        },
        editor: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['checkups.edit_id'],
                to: ['bees.id'],
            },
        },
    });
}
exports.Checkup = Checkup;
