/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('checkups', (t) => {
    t.decimal('varroa', 5, 2).alter();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('checkups', (t) => {
    t.string('varroa', 12).alter();
  });
}
