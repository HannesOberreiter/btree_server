/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.createTable('federated_credentials', (t) => {
    t.increments('id').primary().unsigned();
    t.string('provider', 45).notNullable();
    t.string('provider_id', 45).index();
    t.string('mail', 100).notNullable();
    t.integer('bee_id').unsigned().nullable();
    t.foreign('bee_id')
      .references('bees.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    t.timestamp('created_at').nullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  knex.schema.alterTable('federated_credentials', (t) => {
    t.dropForeign('bee_id');
  });
  return knex.schema.dropTable('federated_credentials');
};
