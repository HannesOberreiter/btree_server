"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginAttemp = void 0;
const user_model_js_1 = require("./user.model.js");
const base_model_js_1 = require("./base.model.js");
class LoginAttemp extends base_model_js_1.BaseModel {
    id;
    time;
    bee_id;
    user;
    static tableName = 'login_attempts';
    static idColumn = 'id';
    static jsonSchema = {
        type: 'object',
        properties: {
            id: { type: 'integer' },
            time: { type: 'string', format: 'date-time' },
            bee_id: { type: 'integer' }, // User FK
        },
    };
    static relationMappings = () => ({
        user: {
            relation: base_model_js_1.BaseModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['login_attempts.bee_id'],
                to: ['bees.id'],
            },
        },
    });
}
exports.LoginAttemp = LoginAttemp;
