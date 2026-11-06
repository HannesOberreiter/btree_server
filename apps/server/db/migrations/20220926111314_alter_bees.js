/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('bees', (t) => {
    t.dropColumn('last_reminder');

    t.timestamp('reminder_premium')
      .nullable()
      .defaultTo(null)
      .comment('Reminder email send for premium running out');
    t.timestamp('reminder_deletion')
      .nullable()
      .defaultTo(null)
      .comment('Reminder email send for upcoming account deletion');
    t.timestamp('reminder_vis')
      .nullable()
      .defaultTo(null)
      .comment('Reminder email send austrian VIS date');
    t.timestamp('notice_bruteforce')
      .nullable()
      .defaultTo(null)
      .comment('Send mail to user when bruteforce is detected');
  });
}
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('bees', (t) => {
    t.timestamp('last_reminder')
      .nullable()
      .defaultTo(knex.fn.now())
      .comment(
        'Reminder email send for premium running out and upcoming account deletion',
      );
    t.dropColumn('reminder_premium');
    t.dropColumn('reminder_deletion');
    t.dropColumn('reminder_vis');
    t.dropColumn('notice_bruteforce');
  });
}
