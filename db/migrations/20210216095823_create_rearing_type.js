export const up = function (knex) {
  return knex.schema.createTable('rearing_types', (t) => {
    t.increments('id').primary().unsigned();

    t.string('name', 24);
    t.text('note', 2000);

    t.integer('user_id').unsigned().nullable();
    t.foreign('user_id')
      .references('companies.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });
};

export const down = function (knex) {
  knex.schema.alterTable('rearing_types', (t) => {
    t.dropForeign('user_id');
  });
  return knex.schema.dropTable('rearing_types');
};
