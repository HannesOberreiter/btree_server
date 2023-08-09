"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Counts = void 0;
const objection_1 = require("objection");
class Counts extends objection_1.Model {
    user_id;
    count;
    kind;
    static tableName = 'counts';
    static idColumn = 'user_id';
    static jsonSchema = {};
}
exports.Counts = Counts;
