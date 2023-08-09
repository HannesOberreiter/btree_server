"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedApiary = void 0;
const company_model_js_1 = require("./company.model.js");
const feed_model_js_1 = require("./feed.model.js");
const objection_1 = require("objection");
class FeedApiary extends objection_1.Model {
    apiary_id;
    apiary_name;
    user_id;
    feed_id;
    feed_date;
    company;
    feed;
    static tableName = 'feeds_apiaries';
    static idColumn = 'feed_id';
    static jsonSchema = {};
    static relationMappings = () => ({
        company: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: company_model_js_1.Company,
            join: {
                from: 'feeds_apiaries.user_id',
                to: 'companies.id',
            },
        },
        feed: {
            relation: objection_1.Model.BelongsToOneRelation,
            modelClass: feed_model_js_1.Feed,
            join: {
                from: 'feeds_apiaries.feed_id',
                to: 'feeds.id',
            },
        },
    });
}
exports.FeedApiary = FeedApiary;
