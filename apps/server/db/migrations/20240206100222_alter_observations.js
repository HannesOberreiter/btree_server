/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema
    .alterTable('observations', (t) => {
      t.dateTime('observed_at').alter();
    })
    .alterTable('observations', (t) => {
      t.index('observed_at');
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema
    .alterTable('observations', (t) => {
      t.dropIndex('observed_at');
    })
    .alterTable('observations', (t) => {
      t.timestamp('observed_at').alter();
    });
}
