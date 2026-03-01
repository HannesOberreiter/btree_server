/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('wizbee_requests', (t) => {
    t.increments('id').primary().unsigned();
    t.datetime('request_time').notNullable().defaultTo(knex.fn.now()).index();
    t.integer('bee_id').unsigned().nullable();
    t.integer('user_id').unsigned().nullable();
    t.integer('tokens_input').defaultTo(0);
    t.integer('tokens_output').defaultTo(0);
    t.text('user_request').nullable();
    t.foreign('bee_id')
      .references('bees.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    t.foreign('user_id')
      .references('bees.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    t.timestamp('created_at').nullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').nullable().defaultTo(knex.fn.now());
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('wizbee_requests');
}
