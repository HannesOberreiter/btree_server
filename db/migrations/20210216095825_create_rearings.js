export function up(knex) {
  return knex.schema.createTable('rearings', (t) => {
    t.increments('id').primary().unsigned();

    t.integer('larvae', 11);
    t.integer('hatch', 11);
    t.string('note', 2000);
    t.datetime('date').index();

    t.integer('type_id').unsigned().nullable();
    t.foreign('type_id')
      .references('rearing_types.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    t.integer('detail_id').unsigned().nullable().comment('Starting Step');
    t.foreign('detail_id')
      .references('rearing_details.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    t.integer('user_id').unsigned().nullable();
    t.foreign('user_id')
      .references('companies.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });
}

export function down(knex) {
  knex.schema.alterTable('rearings', (t) => {
    t.dropForeign('type_id');
    t.dropForeign('detail_id');
    t.dropForeign('user_id');
  });
  return knex.schema.dropTable('rearings');
}
