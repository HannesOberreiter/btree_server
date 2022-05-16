/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  const fs = require('fs');
  const path = require('path');
  const scriptName = path.basename(__filename).replace('.js', '.sql');
  const sql = fs.readFileSync(path.resolve(__dirname, scriptName), 'utf8');
  return knex.raw(sql);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.raw('drop view stats_hives_feeds');
};
