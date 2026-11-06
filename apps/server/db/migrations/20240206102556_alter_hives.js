/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('hives', (t) => {
    t.index(['user_id', 'modus', 'deleted']);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('hives', (t) => {
    t.dropIndex(['user_id', 'modus', 'deleted']);
  });
}
