/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('wizbee_requests', (t) => {
    t.decimal('cost_eur', 10, 6).defaultTo(0).after('tokens_output');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('wizbee_requests', (t) => {
    t.dropColumn('cost_eur');
  });
}
