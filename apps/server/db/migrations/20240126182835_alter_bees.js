/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema
    .alterTable('bees', (t) => {
      t.dropColumn('format');
    })
    .alterTable('bees', (t) => {
      t.string('format', 12)
        .defaultTo('YYYY-MM-DD')
        .comment('User Date Format');
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema
    .alterTable('bees', (t) => {
      t.dropColumn('format');
    })
    .alterTable('bees', (t) => {
      t.boolean('format').defaultTo(1).comment('User Date Format');
    });
}
