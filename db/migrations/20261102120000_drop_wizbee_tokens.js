/**
 * Drop the legacy WizBee token usage table. WizBee logs usage in
 * wizbee_requests since 2026-02; no code reads or writes wizbee_tokens.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.dropTableIfExists('wizbee_tokens');
}

/**
 * Recreate the empty table; dropped rows are not restored.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.createTable('wizbee_tokens', (t) => {
    t.increments('id').primary().unsigned();
    t.date('date').index();
    t.integer('usedTokens').defaultTo(0);
    t.integer('countQuestions').defaultTo(0);
    t.integer('bee_id').unsigned().nullable();
    t.foreign('bee_id')
      .references('bees.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    t.timestamp('created_at').nullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').nullable().defaultTo(knex.fn.now());
  });
}
