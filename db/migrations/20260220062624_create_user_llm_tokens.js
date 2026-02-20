/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('user_llm_tokens', (t) => {
    t.increments('id').primary().unsigned();
    t.integer('bee_id').unsigned().nullable();
    t.foreign('bee_id')
      .references('bees.id')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    t.string('provider', 50).notNullable();
    t.text('tokens').notNullable();
    t.timestamp('created_at').nullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').nullable().defaultTo(knex.fn.now());
    t.unique(['bee_id', 'provider']);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists('user_llm_tokens');
}
