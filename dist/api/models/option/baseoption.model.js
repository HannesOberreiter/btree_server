"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseOptionModel = void 0;
const base_model_js_1 = require("../base.model.js");
class BaseOptionModel extends base_model_js_1.ExtModel {
    id;
    name;
    modus;
    favorite;
    deleted;
    user_id;
    company;
    static idColumn = 'id';
    constructor() {
        super();
    }
    static jsonSchema = {
        type: 'object',
        required: ['name'],
        properties: {
            id: { type: 'integer' },
            name: { type: 'string', minLength: 1, maxLength: 45 },
            favorite: { type: 'boolean' },
            modus: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
        },
    };
}
exports.BaseOptionModel = BaseOptionModel;
