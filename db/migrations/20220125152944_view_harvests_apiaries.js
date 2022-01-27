/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    const fs = require('fs');
    const path = require('path');
    const scriptName = '20220125152944_view_tasks_apiaries.sql';
    let sql = fs.readFileSync(path.resolve(__dirname, scriptName), 'utf8');
    return knex.raw(sql.replace(/task/g, "harvest"));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.raw("drop view harvests_apiaries");
};

