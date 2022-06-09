/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('rearings', (t) => {
    t.string('name', 24).index().after('id')
    t.string('symbol', 24).defaultTo('venus').after('name')
    t.integer('mated', 11).after('hatch').defaultTo(0);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.alterTable('rearings', (t) => {
    t.dropColumns(['mated', 'name', 'symbol']);
  });
};
