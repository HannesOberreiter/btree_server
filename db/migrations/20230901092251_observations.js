/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.createTable('observations', (t) => {
    t.increments('id').primary().unsigned();
    t.string('taxa', 45).index();
    t.integer('external_service').unsigned().index();
    t.integer('external_id').unsigned().index();
    t.point('location');
    t.json('data');

    t.timestamp('observed_at').nullable().defaultTo(knex.fn.now());
    t.timestamp('created_at').nullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').nullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.dropTable('observations');
};
