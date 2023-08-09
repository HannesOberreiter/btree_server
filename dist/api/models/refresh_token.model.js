"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshToken = void 0;
const company_bee_model_js_1 = require("./company_bee.model.js");
const objection_1 = require("objection");
const base_model_js_1 = require("./base.model.js");
class RefreshToken extends base_model_js_1.BaseModel {
    token;
    expires;
    user_id;
    bee_id;
    'user-agent';
    company_bee;
    static tableName = 'refresh_tokens';
    static idColumn = 'id';
    static jsonSchema = {
        type: 'object',
        properties: {
            id: { type: 'integer' },
            token: { type: 'string', minLength: 10 },
            expires: { type: 'string', format: 'date-time' },
            'user-agent': { type: 'string', minLength: 1, maxLength: 65 },
            user_id: { type: 'integer' },
            bee_id: { type: 'integer' }, // User FK
        },
    };
    static relationMappings = () => ({
        company_bee: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: company_bee_model_js_1.CompanyBee,
            join: {
                from: ['refresh_tokens.user_id', 'refresh_tokens.bee_id'],
                to: ['company_bee.user_id', 'company_bee.bee_id'],
            },
        },
    });
}
exports.RefreshToken = RefreshToken;
