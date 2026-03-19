/* Promo code table to extend premium membership */
export function up(knex) {
  return knex.schema.createTable('promos', (t) => {
    t.increments('id').primary().unsigned();

    t.string('code', 128);
    t.integer('months', 11).defaultTo(12);
    t.datetime('date');
    t.boolean('used').defaultTo(0).comment('If code is already used');
    t.integer('user_id').comment(
      'user_id for which companies the code was used, no FK needed',
    );
  });
}

export function down(knex) {
  return knex.schema.dropTable('promos');
}
