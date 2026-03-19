/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('queens', (table) => {
    table.string('name', 36).alter();
    table.string('mother', 36).alter();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('queens', (table) => {
    table.string('name', 24).alter();
    table.string('mother', 24).alter();
  });
}
