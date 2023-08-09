"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HarvestApiary = void 0;
const company_model_js_1 = require("./company.model.js");
const harvest_model_js_1 = require("./harvest.model.js");
const objection_1 = require("objection");
class HarvestApiary extends objection_1.Model {
    apiary_id;
    apiary_name;
    user_id;
    harvest_id;
    harvest_date;
    company;
    harvest;
    static tableName = 'harvests_apiaries';
    static idColumn = 'harvest_id';
    static jsonSchema = {};
    static relationMappings = () => ({
        company: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: 'harvests_apiaries.user_id',
                to: 'companies.id',
            },
        },
        harvest: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: harvest_model_js_1.Harvest,
            join: {
                from: 'harvests_apiaries.harvest_id',
                to: 'harvests.id',
            },
        },
    });
}
exports.HarvestApiary = HarvestApiary;
