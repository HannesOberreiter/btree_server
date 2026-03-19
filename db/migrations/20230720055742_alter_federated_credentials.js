/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('federated_credentials', (t) => {
    t.timestamp('last_visit').nullable().defaultTo(null);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('federated_credentials', (t) => {
    t.dropColumn('last_visit');
  });
}
