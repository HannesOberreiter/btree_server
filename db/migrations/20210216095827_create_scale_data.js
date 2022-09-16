exports.up = function (knex) {
  return knex.schema.createTable('scale_data', (t) => {
    t.increments('id').primary().unsigned();

    t.timestamp('datetime').index();
    t.decimal('weight', 6, 2);
    t.decimal('temp1', 5, 2);
    t.decimal('temp2', 5, 2);
    t.decimal('rain', 5, 2);
    t.decimal('humidity', 5, 2);
    t.string('note', 300);

    t.integer('scale_id').unsigned().nullable();
    t.foreign('scale_id')
      .references('scales.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });
};

exports.down = function (knex) {
  knex.schema.alterTable('scale_data', (t) => {
    t.dropForeign('scale_id');
  });
  return knex.schema.dropTable('scale_data');
};
