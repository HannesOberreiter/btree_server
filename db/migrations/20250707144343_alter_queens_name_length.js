
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.alterTable('queens', function(table) {
    table.string('name', 36).alter();
    table.string('mother', 36).alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.alterTable('queens', function(table) {
    table.string('name', 24).alter();
    table.string('mother', 24).alter();
  });
};
