/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('payments', (t) => {
    t.increments('id').primary().unsigned();
    t.date('date').index().defaultTo(knex.fn.now());
    t.decimal('amount', 8, 2);
    t.string('type', 45);
    t.integer('user_id').unsigned().nullable().comment('Company ID');
    t.foreign('user_id')
      .references('companies.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  knex.schema.alterTable('payments', (t) => {
    t.dropForeign('user_id');
  });
  return knex.schema.dropTable('payments');
};
