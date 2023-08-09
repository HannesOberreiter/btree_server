"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Todo = void 0;
const base_model_js_1 = require("./base.model.js");
const company_model_js_1 = require("./company.model.js");
const user_model_js_1 = require("./user.model.js");
class Todo extends base_model_js_1.ExtModel {
    id;
    name;
    date;
    note;
    url;
    done;
    edit_id;
    bee_id;
    user_id;
    static tableName = 'todos';
    static idColumn = 'id';
    company;
    creator;
    editor;
    static jsonSchema = {
        type: 'object',
        required: ['date', 'name'],
        properties: {
            id: { type: 'integer' },
            name: { type: 'string', maxLength: 48 },
            date: { type: 'string', format: 'date' },
            note: { type: 'string', maxLength: 2000 },
            url: { type: 'string', maxLength: 512 },
            done: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            user_id: { type: 'integer' },
            bee_id: { type: 'integer' },
            edit_id: { type: 'integer' }, // Updater Bee FK
        },
    };
    static relationMappings = () => ({
        company: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: ['todos.user_id'],
                to: ['company.id'],
            },
        },
        creator: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['todos.bee_id'],
                to: ['bees.id'],
            },
        },
        editor: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['todos.edit_id'],
                to: ['bees.id'],
            },
        },
    });
}
exports.Todo = Todo;
