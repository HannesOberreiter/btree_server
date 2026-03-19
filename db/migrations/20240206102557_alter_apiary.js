/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('apiaries', (t) => {
    t.index(['user_id', 'modus', 'deleted']);
  });
}

export function down(knex) {
  return knex.schema.alterTable('apiaries', (t) => {
    t.dropIndex(['user_id', 'modus', 'deleted']);
  });
}
