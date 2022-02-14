/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  const fs = require('fs');
  const path = require('path');
  const scriptName = '20220214112046_view_calendar_checkups.sql';
  let sql = fs.readFileSync(path.resolve(__dirname, scriptName), 'utf8');
  return knex.raw(sql);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.raw('drop view calendar_checkups');
};
