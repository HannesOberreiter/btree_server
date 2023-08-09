"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FederatedCredential = void 0;
const user_model_js_1 = require("./user.model.js");
const base_model_js_1 = require("./base.model.js");
class FederatedCredential extends base_model_js_1.BaseModel {
    id;
    provider;
    provider_id;
    mail;
    bee_id;
    last_visit;
    user;
    static tableName = 'federated_credentials';
    static idColumn = 'id';
    static jsonSchema = {
        type: 'object',
        properties: {
            id: { type: 'integer' },
            provider: { type: 'string', maxLength: 45 },
            provider_id: { type: 'string', maxLength: 45 },
            mail: { type: 'string', maxLength: 100 },
            bee_id: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            last_login: { type: 'string', format: 'date-time' },
        },
    };
    static relationMappings = () => ({
        user: {
            relation: base_model_js_1.BaseModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['federated_credentials.bee_id'],
                to: ['bees.id'],
            },
        },
    });
}
exports.FederatedCredential = FederatedCredential;
