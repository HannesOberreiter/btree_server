/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('dropbox', (t) => {
    t.text('refresh_token', 2_500).alter();
    t.string('access_token', 2_500).alter();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('dropbox', (t) => {
    t.string('refresh_token', 255).alter();
    t.string('access_token', 255).alter();
  });
}
