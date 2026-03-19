export function up(knex) {
  return knex.schema.createTable('login_attempts', (t) => {
    t.increments('id').primary().unsigned();

    t.datetime('time').index();

    t.integer('bee_id').unsigned().nullable();
    t.foreign('bee_id')
      .references('bees.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });
}

export function down(knex) {
  knex.schema.alterTable('login_attempts', (t) => {
    t.dropForeign('bee_id');
  });
  return knex.schema.dropTable('login_attempts');
}
