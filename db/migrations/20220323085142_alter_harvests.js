/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('harvests', (t) => {
    t.decimal('frames', 7, 1).alter();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('harvests', (t) => {
    t.integer('frames', 12).alter();
  });
}
