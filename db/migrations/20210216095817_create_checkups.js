export const up = function (knex) {
  return knex.schema.createTable('checkups', (t) => {
    t.increments('id').primary().unsigned();

    t.date('date').index();
    t.date('enddate').index();

    t.boolean('queen');
    t.boolean('queencells');
    t.boolean('eggs');
    t.boolean('capped_brood');

    t.decimal('brood', 3, 1);
    t.decimal('pollen', 3, 1);
    t.decimal('comb', 3, 1);
    t.decimal('temper', 3, 1);
    t.decimal('calm_comb', 3, 1);
    t.decimal('swarm', 3, 1);

    t.string('varroa', 12).comment(
      'Varchar old system had strings in it needs to be cleaned out.',
    );
    t.integer('strong', 12);

    t.decimal('temp', 5, 1);
    t.decimal('weight', 5, 1);
    t.time('time');

    t.integer('broodframes', 12);
    t.integer('honeyframes', 12);
    t.integer('foundation', 12);
    t.integer('emptyframes', 12);

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
      .references('checkup_types.id')
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

export const down = function (knex) {
  knex.schema.alterTable('checkups', (t) => {
    t.dropForeign('user_id');
    t.dropForeign('bee_id');
    t.dropForeign('edit_id');
    t.dropForeign('hive_id');
    t.dropForeign('type_id');
  });
  return knex.schema.dropTable('checkups');
};
