"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Treatment = void 0;
const base_model_js_1 = require("./base.model.js");
const hive_model_js_1 = require("./hive.model.js");
const user_model_js_1 = require("./user.model.js");
const treatment_type_model_js_1 = require("./option/treatment_type.model.js");
const treatment_disease_model_js_1 = require("./option/treatment_disease.model.js");
const treatment_vet_model_js_1 = require("./option/treatment_vet.model.js");
const treatment_apiary_model_js_1 = require("./treatment_apiary.model.js");
class Treatment extends base_model_js_1.ExtModel {
    id;
    date;
    enddate;
    amount;
    wait;
    temperature;
    note;
    url;
    done;
    deleted;
    user_id;
    edit_id;
    bee_id;
    hive_id;
    static tableName = 'treatments';
    static idColumn = 'id';
    type;
    disease;
    vet;
    treatment_apiary;
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
            wait: { type: 'number' },
            temperature: { type: 'number' },
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
            vet_id: { type: 'integer' },
            disease_id: { type: 'integer' },
            bee_id: { type: 'integer' },
            edit_id: { type: 'integer' }, // Updater Bee FK
        },
    };
    static relationMappings = () => ({
        type: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: treatment_type_model_js_1.TreatmentType,
            join: {
                from: ['treatments.type_id'],
                to: ['treatment_types.id'],
            },
        },
        disease: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: treatment_disease_model_js_1.TreatmentDisease,
            join: {
                from: ['treatments.disease_id'],
                to: ['treatment_diseases.id'],
            },
        },
        vet: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: treatment_vet_model_js_1.TreatmentVet,
            join: {
                from: ['treatments.vet_id'],
                to: ['treatment_vets.id'],
            },
        },
        hive: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: hive_model_js_1.Hive,
            join: {
                from: ['treatments.hive_id'],
                to: ['hives.id'],
            },
        },
        treatment_apiary: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: treatment_apiary_model_js_1.TreatmentApiary,
            join: {
                from: ['treatments.id'],
                to: ['treatments_apiaries.treatment_id'],
            },
        },
        creator: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['treatments.bee_id'],
                to: ['bees.id'],
            },
        },
        editor: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['treatments.edit_id'],
                to: ['bees.id'],
            },
        },
    });
}
exports.Treatment = Treatment;
