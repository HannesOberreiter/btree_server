/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  const fs = require('fs');
  const path = require('path');
  const scriptName = '20220215144233_view_calendar_movements.sql';
  let sql = fs.readFileSync(path.resolve(__dirname, scriptName), 'utf8');
  return knex.raw(sql);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.raw('drop view calendar_movements');
};
