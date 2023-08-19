// JWT refresh Token Table, user-agent as device identifier
export const up = function (knex) {
  return knex.schema.createTable('refresh_tokens', (t) => {
    t.increments('id').primary().unsigned();

    t.string('token').index();
    t.timestamp('expires');
    t.string('user-agent', 65);

    t.integer('user_id').unsigned().nullable();
    t.integer('bee_id').unsigned().nullable();

    t.foreign('user_id')
      .references('companies.id')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    t.foreign('bee_id')
      .references('bees.id')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
  });
};

export const down = function (knex) {
  knex.schema.alterTable('refresh_tokens', (t) => {
    t.dropForeign('user_id');
    t.dropForeign('bee_id');
  });
  return knex.schema.dropTable('refresh_tokens');
};
