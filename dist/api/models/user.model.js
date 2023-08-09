"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const base_model_js_1 = require("./base.model.js");
const company_model_js_1 = require("./company.model.js");
const company_bee_model_js_1 = require("./company_bee.model.js");
class User extends base_model_js_1.ExtModel {
    id;
    email;
    username;
    password;
    reset;
    salt;
    lang;
    state;
    acdate;
    format;
    newsletter;
    sound;
    saved_company;
    reset_timestamp;
    last_visit;
    reminder_premium;
    reminder_deletion;
    reminder_vis;
    notice_bruteforce;
    company;
    company_bee;
    static tableName = 'bees';
    static idColumn = 'id';
    static jsonSchema = {
        type: 'object',
        required: ['email', 'password', 'salt'],
        properties: {
            id: { type: 'integer' },
            username: { type: 'string', maxLength: 45 },
            email: { type: 'string', format: 'email', minLength: 5, maxLength: 100 },
            password: { type: 'string', minLength: 6, maxLength: 128 },
            salt: { type: 'string', minLength: 10, maxLength: 128 },
            reset: { type: 'string', maxLength: 128 },
            reset_timestamp: { type: 'string', format: 'date-time' },
            state: { type: 'integer' },
            lang: {
                type: 'string',
                minLength: 2,
                maxLength: 3,
                enum: ['de', 'en', 'it', 'fr'],
            },
            format: { type: 'number', enum: [1, 2] },
            acdate: { type: 'boolean' },
            newsletter: { type: 'boolean' },
            todo: { type: 'boolean' },
            sound: { type: 'boolean' },
            tablexscroll: { type: 'boolean' },
            source: { type: 'string', minLength: 0, maxLength: 20 },
            saved_company: { type: 'integer' },
            last_visit: { type: 'string', format: 'date-time' },
            reminder_premium: { type: 'string', format: 'date-time' },
            reminder_deletion: { type: 'string', format: 'date-time' },
            reminder_vis: { type: 'string', format: 'date-time' },
            notice_bruteforce: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
        },
    };
    // Omit fields for json response from model
    $formatJson(user) {
        super.$formatJson(user);
        delete user.password;
        delete user.salt;
        delete user.reset;
        return user;
    }
    static get modifiers() {
        return {
            identifier(builder) {
                builder.select('email', 'username');
            },
        };
    }
    static relationMappings = () => ({
        company: {
            relation: base_model_js_1.ExtModel.ManyToManyRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: 'bees.id',
                through: {
                    modelClass: company_bee_model_js_1.CompanyBee,
                    from: 'company_bee.bee_id',
                    to: 'company_bee.user_id',
                },
                to: 'companies.id',
            },
        },
        company_bee: {
            relation: base_model_js_1.ExtModel.HasManyRelation,
            modelClass: company_bee_model_js_1.CompanyBee,
            join: {
                from: 'bees.id',
                to: 'company_bee.bee_id',
            },
        },
    });
}
exports.User = User;
