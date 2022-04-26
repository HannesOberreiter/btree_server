// m:n table with rank for users in companies
exports.up = function (knex) {
  return knex.schema.createTable('company_bee', (t) => {
    t.increments('id').primary().unsigned();
    t.integer('user_id').unsigned().nullable();
    t.integer('bee_id').unsigned().nullable();

    t.foreign('user_id')
      .references('companies.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    t.foreign('bee_id')
      .references('bees.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    t.integer('rank', 4)
      .defaultTo(1)
      .comment('Rank of the User, eg. read-only, user and admin');
  });
};

exports.down = function (knex) {
  knex.schema.alterTable('company_bee', (t) => {
    t.dropForeign('user_id');
    t.dropForeign('bee_id');
  });
  return knex.schema.dropTable('company_bee');
};
