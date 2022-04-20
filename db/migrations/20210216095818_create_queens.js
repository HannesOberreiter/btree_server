exports.up = function (knex) {
  return knex.schema.createTable('queens', (t) => {
    t.increments('id').primary().unsigned();

    t.string('name', 24);
    t.string('mark_colour', 24);
    t.string('mother', 24);
    t.date('date');
    t.date('move_date');

    t.string('note', 2000);
    t.string('url', 512);
    t.boolean('modus').defaultTo(1);
    t.date('modus_date')
      .nullable()
      .comment('Keep track of when queen was set inactive.');

    t.integer('hive_id').unsigned().nullable();
    t.foreign('hive_id')
      .references('hives.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    t.integer('race_id').unsigned().nullable();
    t.foreign('race_id')
      .references('queen_races.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    t.integer('mating_id').unsigned().nullable();
    t.foreign('mating_id')
      .references('queen_matings.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    t.integer('user_id').unsigned().nullable();
    t.foreign('user_id')
      .references('companies.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    t.boolean('deleted')
      .defaultTo(0)
      .comment('if element is deleted (soft delete)');
    t.timestamp('deleted_at').nullable().defaultTo(knex.fn.now());

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
};

exports.down = function (knex) {
  knex.schema.alterTable('queens', (t) => {
    t.dropForeign('bee_id');
    t.dropForeign('edit_id');
    t.dropForeign('race_id');
    t.dropForeign('mating_id');
    t.dropForeign('hive_id');
    t.dropForeign('user_id');
  });
  return knex.schema.dropTable('queens');
};
