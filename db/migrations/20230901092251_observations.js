/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('observations', (t) => {
    t.increments('id').primary().unsigned();
    t.string('taxa', 45).index();
    t.string('external_service', 45);
    t.integer('external_id').unsigned().nullable().index();
    t.point('location');
    t.json('data');

    t.timestamp('observed_at').nullable().defaultTo(knex.fn.now());
    t.timestamp('created_at').nullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').nullable().defaultTo(knex.fn.now());
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('observations');
}
