"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldSetting = void 0;
const user_model_js_1 = require("./user.model.js");
const base_model_js_1 = require("./base.model.js");
class FieldSetting extends base_model_js_1.BaseModel {
    id;
    settings;
    bee_id;
    static tableName = 'field_settings';
    static idColumn = 'id';
    user;
    static jsonSchema = {
        type: 'object',
        required: ['settings'],
        properties: {
            id: { type: 'integer' },
            settings: { type: 'object' },
            bee_id: { type: 'integer' },
        },
    };
    static relationMappings = () => ({
        user: {
            relation: base_model_js_1.BaseModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['field_settings.bee_id'],
                to: ['bee.id'],
            },
        },
    });
}
exports.FieldSetting = FieldSetting;
