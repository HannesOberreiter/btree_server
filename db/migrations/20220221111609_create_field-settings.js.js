/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('field_settings', (t) => {
    t.increments('id').primary().unsigned();
    t.json('settings').comment(
      'Object contains tablename, field, boolean to indicate if field should be visible in frontend or not.'
    );
    // Foreign Keys
    t.integer('bee_id').unsigned().nullable();
    t.foreign('bee_id')
      .references('bees.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  knex.schema.alterTable('field_settings', (t) => {
    t.dropForeign('bee_id');
  });
  return knex.schema.dropTable('field_settings');
};
