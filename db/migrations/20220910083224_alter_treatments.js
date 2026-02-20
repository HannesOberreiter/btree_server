/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('treatments', (t) => {
    t.decimal('temperature', 5, 1).comment('Temperature input field');
  });
}
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('treatments', (t) => {
    t.dropColumn('temperature');
  });
}
