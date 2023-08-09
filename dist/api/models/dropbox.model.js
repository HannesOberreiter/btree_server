"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dropbox = void 0;
const objection_1 = require("objection");
const company_model_js_1 = require("./company.model.js");
class Dropbox extends objection_1.Model {
    id;
    refresh_token;
    access_token;
    user_id;
    company;
    static tableName = 'dropbox';
    static idColumn = 'id';
    static jsonSchema = {
        type: 'object',
        required: ['refresh_token', 'access_token', 'user_id'],
        properties: {
            refresh_token: { type: 'string', minLength: 1, maxLength: 200 },
            access_token: { type: 'string', minLength: 1, maxLength: 200 },
            user_id: { type: 'integer' },
        },
    };
    static relationMappings = () => ({
        company: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: 'dropbox.user_id',
                to: 'companies.id',
            },
        },
    });
}
exports.Dropbox = Dropbox;
