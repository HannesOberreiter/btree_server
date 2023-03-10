/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.dropTableIfExists('sessions');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.createTable('sessions', (t) => {
    t.string('sid').notNullable().primary();
    t.json('sess').notNullable();
    t.timestamp('expired').notNullable().index();
  });
};
