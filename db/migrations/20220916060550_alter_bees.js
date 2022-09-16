/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('bees', (t) => {
    t.timestamp('last_reminder')
      .nullable()
      .defaultTo(knex.fn.now())
      .comment(
        'Reminder email send for premium running out and upcoming account deletion'
      );
  });
};
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('bees', (t) => {
    t.dropColumn('last_reminder');
  });
};
