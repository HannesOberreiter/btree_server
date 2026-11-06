export async function up(knex) {
  await knex.schema.createTable('wax_products', (t) => {
    t.increments('id').primary().unsigned();
    t.string('name', 100).notNullable();
    t.boolean('modus').notNullable().defaultTo(1);
    t.boolean('favorite').notNullable().defaultTo(0);
    t.integer('user_id').unsigned().nullable();
    t.foreign('user_id')
      .references('companies.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    t.unique(['user_id', 'name']);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('wax_origin_types', (t) => {
    t.increments('id').primary().unsigned();
    t.string('name', 100).notNullable();
    t.boolean('modus').notNullable().defaultTo(1);
    t.boolean('favorite').notNullable().defaultTo(0);
    t.integer('user_id').unsigned().nullable();
    t.foreign('user_id')
      .references('companies.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    t.unique(['user_id', 'name']);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('wax_lots', (t) => {
    t.increments('id').primary().unsigned();
    t.string('code', 100).notNullable();
    t.string('note', 2000).nullable();
    t.integer('product_id').unsigned().nullable();
    t.foreign('product_id')
      .references('wax_products.id')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
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
    t.unique(['user_id', 'code']);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('wax_operations', (t) => {
    t.increments('id').primary().unsigned();
    t.date('date').notNullable().index();
    t.string('type', 45).notNullable().index();
    t.string('counterparty', 255).nullable();
    t.string('reference', 255).nullable();
    t.string('url', 512).nullable();
    t.string('note', 2000).nullable();
    t.integer('origin_type_id').unsigned().nullable();
    t.foreign('origin_type_id')
      .references('wax_origin_types.id')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    t.integer('reversal_of_id').unsigned().nullable();
    t.foreign('reversal_of_id')
      .references('wax_operations.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
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
    t.timestamps(true, true);
    t.unique(['user_id', 'reversal_of_id']);
  });

  await knex.schema.createTable('wax_operation_hives', (t) => {
    t.increments('id').primary().unsigned();
    t.integer('operation_id').unsigned().notNullable();
    t.foreign('operation_id')
      .references('wax_operations.id')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    t.integer('hive_id').unsigned().nullable();
    t.foreign('hive_id')
      .references('hives.id')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    t.unique(['operation_id', 'hive_id']);
  });

  await knex.schema.createTable('wax_operation_lines', (t) => {
    t.increments('id').primary().unsigned();
    t.string('direction', 10).notNullable();
    t.decimal('quantity_kg', 12, 2).notNullable();
    t.integer('operation_id').unsigned().notNullable();
    t.foreign('operation_id')
      .references('wax_operations.id')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    t.integer('lot_id').unsigned().notNullable();
    t.foreign('lot_id')
      .references('wax_lots.id')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    t.index(['lot_id', 'direction']);
    t.index(['operation_id', 'direction']);
  });
  await knex.raw(`
    ALTER TABLE wax_operation_lines
      ADD CONSTRAINT wax_lines_direction_check
        CHECK (direction IN ('input', 'output')),
      ADD CONSTRAINT wax_lines_quantity_positive_check
        CHECK (quantity_kg > 0)
  `);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('wax_operation_lines');
  await knex.schema.dropTableIfExists('wax_operation_hives');
  await knex.schema.dropTableIfExists('wax_operations');
  await knex.schema.dropTableIfExists('wax_lots');
  await knex.schema.dropTableIfExists('wax_origin_types');
  await knex.schema.dropTableIfExists('wax_products');
}
