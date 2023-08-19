export const up = function (knex) {
  return knex.schema.createTable('rearing_steps', (t) => {
    t.increments('id').primary().unsigned();

    t.integer('position', 11).comment('Step position for rearings');

    t.integer('type_id').unsigned().nullable();
    t.foreign('type_id')
      .references('rearing_types.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    t.integer('detail_id').unsigned().nullable();
    t.foreign('detail_id')
      .references('rearing_details.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });
};

export const down = function (knex) {
  knex.schema.alterTable('rearing_steps', (t) => {
    t.dropForeign('type_id');
    t.dropForeign('detail_id');
  });
  return knex.schema.dropTable('rearing_steps');
};
