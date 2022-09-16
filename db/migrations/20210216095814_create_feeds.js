exports.up = function (knex) {
  return knex.schema.createTable('feeds', (t) => {
    t.increments('id').primary().unsigned();

    t.date('date').index();
    t.date('enddate').index();
    t.decimal('amount', 7, 1);
    t.string('note', 2000);
    t.string('url', 512);
    t.boolean('done').defaultTo(1);

    t.integer('hive_id').unsigned().nullable();
    t.foreign('hive_id')
      .references('hives.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    t.integer('type_id').unsigned().nullable();
    t.foreign('type_id')
      .references('feed_types.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    t.boolean('deleted')
      .defaultTo(0)
      .comment('if element is deleted (soft delete)');
    t.timestamp('deleted_at').nullable().defaultTo(knex.fn.now());

    t.timestamp('created_at').nullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').nullable().defaultTo(knex.fn.now());

    t.integer('user_id').unsigned().nullable().comment('Company');
    t.foreign('user_id')
      .references('companies.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

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
};

exports.down = function (knex) {
  knex.schema.alterTable('feeds', (t) => {
    t.dropForeign('user_id');
    t.dropForeign('bee_id');
    t.dropForeign('edit_id');
    t.dropForeign('hive_id');
    t.dropForeign('type_id');
  });
  return knex.schema.dropTable('feeds');
};
