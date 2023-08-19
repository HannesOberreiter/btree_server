export const up = function (knex) {
  return knex.schema.createTable('hives', (t) => {
    t.increments('id').primary().unsigned();

    t.string('name', 24).index();
    t.integer('grouphive', 11);
    t.integer('position', 11);

    t.string('note', 2000);
    t.boolean('modus').defaultTo(1).index();
    t.date('modus_date')
      .nullable()
      .comment('Date keeps track when modus changes to inactive.');

    t.integer('source_id').unsigned().nullable();
    t.foreign('source_id')
      .references('hive_sources.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    t.integer('type_id').unsigned().nullable();
    t.foreign('type_id')
      .references('hive_types.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    t.boolean('deleted')
      .defaultTo(0)
      .index()
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

export const down = function (knex) {
  knex.schema.alterTable('hives', (t) => {
    t.dropForeign('user_id');
    t.dropForeign('bee_id');
    t.dropForeign('edit_id');
    t.dropForeign('source_id');
    t.dropForeign('type_id');
  });
  return knex.schema.dropTable('hives');
};
