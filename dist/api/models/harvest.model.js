"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Harvest = void 0;
const base_model_js_1 = require("./base.model.js");
const hive_model_js_1 = require("./hive.model.js");
const user_model_js_1 = require("./user.model.js");
const harvest_type_model_js_1 = require("./option/harvest_type.model.js");
const harvest_apiary_model_js_1 = require("./harvest_apiary.model.js");
class Harvest extends base_model_js_1.ExtModel {
    id;
    date;
    enddate;
    amount;
    frames;
    water;
    charge;
    note;
    url;
    done;
    deleted;
    user_id;
    edit_id;
    bee_id;
    hive_id;
    static tableName = 'harvests';
    static idColumn = 'id';
    type;
    harvest_apiary;
    hive;
    creator;
    editor;
    static jsonSchema = {
        type: 'object',
        required: ['date', 'hive_id'],
        properties: {
            id: { type: 'integer' },
            date: { type: 'string', format: 'date' },
            enddate: { type: 'string', format: 'date' },
            amount: { type: 'number' },
            water: { type: 'number' },
            frames: { type: 'number' },
            charge: { type: 'string', maxLength: 24 },
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
            modelClass: harvest_type_model_js_1.HarvestType,
            join: {
                from: ['harvests.type_id'],
                to: ['harvest_types.id'],
            },
        },
        hive: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: hive_model_js_1.Hive,
            join: {
                from: ['harvests.hive_id'],
                to: ['hives.id'],
            },
        },
        harvest_apiary: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: harvest_apiary_model_js_1.HarvestApiary,
            join: {
                from: ['harvests_apiaries.harvest_id'],
                to: ['harvests.id'],
            },
        },
        creator: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['harvests.bee_id'],
                to: ['bees.id'],
            },
        },
        editor: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['harvests.edit_id'],
                to: ['bees.id'],
            },
        },
    });
}
exports.Harvest = Harvest;
