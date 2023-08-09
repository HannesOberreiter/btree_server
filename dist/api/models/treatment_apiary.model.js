"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentApiary = void 0;
const company_model_js_1 = require("./company.model.js");
const treatment_model_js_1 = require("./treatment.model.js");
const objection_1 = require("objection");
class TreatmentApiary extends objection_1.Model {
    apiary_id;
    apiary_name;
    user_id;
    treatment_id;
    treatment_date;
    company;
    treatment;
    static tableName = 'treatments_apiaries';
    static idColumn = 'treatment_id';
    static jsonSchema = {};
    static relationMappings = () => ({
        company: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: 'treatments_apiaries.user_id',
                to: 'companies.id',
            },
        },
        treatment: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: treatment_model_js_1.Treatment,
            join: {
                from: 'treatments_apiaries.treatment_id',
                to: 'treatments_id.id',
            },
        },
    });
}
exports.TreatmentApiary = TreatmentApiary;
