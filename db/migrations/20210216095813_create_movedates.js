export function up(knex) {
  return knex.schema.createTable('movedates', (t) => {
    t.increments('id').primary().unsigned();

    t.datetime('date').index();

    t.integer('apiary_id').unsigned().nullable();
    t.foreign('apiary_id')
      .references('apiaries.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    t.integer('hive_id').unsigned().nullable();
    t.foreign('hive_id')
      .references('hives.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    t.timestamp('created_at').nullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').nullable().defaultTo(knex.fn.now());

    t.integer('bee_id').unsigned().nullable().comment('Creator');
    t.integer('edit_id').unsigned().nullable().comment('Editor');

    t.foreign('bee_id')
      .references('bees.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    t.foreign('edit_id')
      .references('bees.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });
}

export function down(knex) {
  knex.schema.alterTable('movedates', (t) => {
    t.dropForeign('bee_id');
    t.dropForeign('edit_id');
    t.dropForeign('apiary_id');
    t.dropForeign('hive_id');
  });
  return knex.schema.dropTable('movedates');
}
