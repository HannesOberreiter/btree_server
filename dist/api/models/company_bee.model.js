"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyBee = void 0;
const user_model_js_1 = require("./user.model.js");
const company_model_js_1 = require("./company.model.js");
const objection_1 = require("objection");
class CompanyBee extends objection_1.Model {
    id;
    user_id;
    bee_id;
    rank;
    company;
    user;
    static tableName = 'company_bee';
    static idColumn = 'id';
    static jsonSchema = {
        type: 'object',
        properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            bee_id: { type: 'integer' },
            rank: { type: 'integer' },
        },
    };
    static relationMappings = () => ({
        company: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: 'company_bee.user_id',
                to: 'companies.id',
            },
        },
        user: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: 'company_bee.bee_id',
                to: 'bees.id',
            },
        },
    });
}
exports.CompanyBee = CompanyBee;
