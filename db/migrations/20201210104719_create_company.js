exports.up = function (knex) {
  return knex.schema.createTable('companies', (t) => {
    t.increments('id').primary().unsigned();
    t.string('name', 45);
    t.date('paid')
      .comment('How long premium account is paid for')
      .defaultTo('1989-01-05');
    // Secure APIs
    t.string('image', 65).comment('User Upload Folder Name');
    t.string('api_key', 65).comment('API Key to Access ICAL and Scale API');

    t.timestamp('created_at').nullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').nullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('companies');
};
