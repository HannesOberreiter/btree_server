/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
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
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  knex.schema.alterTable('wizbee_tokens', (t) => {
    t.dropForeign('bee_id');
  });
  return knex.schema.dropTable('wizbee_tokens');
};
