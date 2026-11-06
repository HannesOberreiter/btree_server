export function up(knex) {
  return knex.schema.createTable('apiaries', (t) => {
    t.increments('id').primary().unsigned();
    t.string('name', 45).index();
    t.string('description', 512);
    // https://stackoverflow.com/a/69646801/5316675
    t.decimal('latitude', 8, 6).notNullable();
    t.decimal('longitude', 9, 6).notNullable();
    t.string('note', 2000);
    t.string('url', 512).comment('Connected Image Url or Webcam Url');
    t.boolean('modus').defaultTo(1).comment('Active/Inactive');

    t.boolean('deleted')
      .defaultTo(0)
      .comment('if element is deleted (soft delete)');
    t.timestamp('deleted_at').nullable().defaultTo(knex.fn.now());

    t.timestamp('created_at').nullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').nullable().defaultTo(knex.fn.now());

    t.integer('bee_id').unsigned().nullable().comment('Creator');
    t.integer('edit_id').unsigned().nullable().comment('Editor');
    t.integer('user_id').unsigned().nullable().comment('Company ID');

    t.foreign('bee_id')
      .references('bees.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    t.foreign('edit_id')
      .references('bees.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    t.foreign('user_id')
      .references('companies.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });
}

export function down(knex) {
  knex.schema.alterTable('apiaries', (t) => {
    t.dropForeign('bee_id');
    t.dropForeign('edit_id');
    t.dropForeign('user_id');
  });
  return knex.schema.dropTable('apiaries');
}
