/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('checkups', (t) => {
    t.renameColumn('temp', 'temperature');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('checkups', (t) => {
    t.renameColumn('temperature', 'temp');
  });
}
