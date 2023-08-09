"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckupApiary = void 0;
const company_model_js_1 = require("./company.model.js");
const checkup_model_js_1 = require("./checkup.model.js");
const objection_1 = require("objection");
class CheckupApiary extends objection_1.Model {
    apiary_id;
    apiary_name;
    user_id;
    checkup_id;
    checkup_date;
    company;
    checkup;
    static tableName = 'checkups_apiaries';
    static idColumn = 'checkup_id';
    static jsonSchema = {};
    static relationMappings = () => ({
        company: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: 'checkups_apiaries.user_id',
                to: 'companies.id',
            },
        },
        checkup: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: checkup_model_js_1.Checkup,
            join: {
                from: 'checkups_apiaries.checkup_id',
                to: 'checkups.id',
            },
        },
    });
}
exports.CheckupApiary = CheckupApiary;
