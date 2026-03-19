export function up(knex) {
  return knex.schema.createTable('dropbox', (t) => {
    t.increments('id').primary().unsigned();

    t.string('refresh_token', 200);
    t.string('access_token', 200);

    t.integer('user_id').unsigned().nullable();
    t.foreign('user_id')
      .references('companies.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });
}

export function down(knex) {
  knex.schema.alterTable('dropbox', (t) => {
    t.dropForeign('user_id');
  });
  return knex.schema.dropTable('dropbox');
}
