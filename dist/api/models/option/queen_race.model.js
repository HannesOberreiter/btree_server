"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueenRace = void 0;
const baseoption_model_js_1 = require("./baseoption.model.js");
const base_model_js_1 = require("../base.model.js");
const company_model_js_1 = require("../company.model.js");
class QueenRace extends baseoption_model_js_1.BaseOptionModel {
    static tableName = 'queen_races';
    constructor() {
        super();
    }
    static relationMappings = {
        company: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: ['queen_races.user_id'],
                to: ['companies.id'],
            },
        },
    };
}
exports.QueenRace = QueenRace;
