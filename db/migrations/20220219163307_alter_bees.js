/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.alterTable('bees', (t) => {
    t.integer('format', 1).alter();
    t.integer('state', 1).alter();
  });
};
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.alterTable('bees', (t) => {
    t.tinyint('format').alter();
    t.tinyint('state').alter();
  });
};
