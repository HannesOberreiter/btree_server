"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Feed = void 0;
const base_model_js_1 = require("./base.model.js");
const hive_model_js_1 = require("./hive.model.js");
const user_model_js_1 = require("./user.model.js");
const feed_type_model_js_1 = require("./option/feed_type.model.js");
const feed_apiary_model_js_1 = require("./feed_apiary.model.js");
class Feed extends base_model_js_1.ExtModel {
    id;
    date;
    enddate;
    amount;
    note;
    url;
    done;
    deleted;
    user_id;
    edit_id;
    bee_id;
    hive_id;
    static tableName = 'feeds';
    static idColumn = 'id';
    type;
    feed_apiary;
    hive;
    creator;
    editor;
    static jsonSchema = {
        type: 'object',
        required: ['date', 'hive_id'],
        properties: {
            id: { type: 'integer' },
            date: { type: 'string', format: 'date' },
            enddate: { type: 'string', format: 'date' },
            amount: { type: 'number' },
            note: { type: 'string', maxLength: 2000 },
            url: { type: 'string', maxLength: 512 },
            done: { type: 'boolean' },
            deleted: { type: 'boolean' },
            deleted_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            user_id: { type: 'integer' },
            hive_id: { type: 'integer' },
            type_id: { type: 'integer' },
            bee_id: { type: 'integer' },
            edit_id: { type: 'integer' }, // Updater Bee FK
        },
    };
    static relationMappings = () => ({
        type: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: feed_type_model_js_1.FeedType,
            join: {
                from: ['feeds.type_id'],
                to: ['feed_types.id'],
            },
        },
        hive: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: hive_model_js_1.Hive,
            join: {
                from: ['feeds.hive_id'],
                to: ['hives.id'],
            },
        },
        feed_apiary: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: feed_apiary_model_js_1.FeedApiary,
            join: {
                from: ['feeds_apiaries.feed_id'],
                to: ['feeds.id'],
            },
        },
        creator: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['feeds.bee_id'],
                to: ['bees.id'],
            },
        },
        editor: {
            relation: base_model_js_1.ExtModel.HasOneRelation,
            modelClass: user_model_js_1.User,
            join: {
                from: ['feeds.edit_id'],
                to: ['bees.id'],
            },
        },
    });
}
exports.Feed = Feed;
