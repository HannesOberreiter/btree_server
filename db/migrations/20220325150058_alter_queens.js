/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('queens', (t) => {
    t.renameColumn('beebreed_nr', 'name');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('queens', (t) => {
    t.renameColumn('name', 'beebreed_nr');
  });
};
