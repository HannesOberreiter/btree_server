"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WizBeeToken = void 0;
const base_model_js_1 = require("./base.model.js");
const user_model_js_1 = require("./user.model.js");
class WizBeeToken extends base_model_js_1.ExtModel {
    id;
    date;
    usedTokens;
    countQuestions;
    bee_id;
    user;
    static tableName = 'wizbee_tokens';
    static idColumn = 'id';
    static jsonSchema = {
        type: 'object',
        required: ['date'],
        properties: {
            id: { type: 'integer' },
            date: { type: 'string', format: 'date' },
            usedTokens: { type: 'integer' },
            countQuestions: { type: 'integer' },
            bee_id: { type: 'integer' },
        },
    };
    static relationMappings = () => ({
        user: {
            relation: base_model_js_1.BaseModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['wizbee_tokens.bee_id'],
                to: ['bees.id'],
            },
        },
    });
}
exports.WizBeeToken = WizBeeToken;
