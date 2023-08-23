export const up = function (knex) {
  return knex.schema.createTable('treatment_vets', (t) => {
    t.increments('id').primary().unsigned();

    t.string('name', 45);
    t.string('note', 2000);

    t.boolean('modus').defaultTo(1);
    t.boolean('favorite').defaultTo(0);

    t.integer('user_id').unsigned().nullable();
    t.foreign('user_id')
      .references('companies.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    t.timestamp('created_at').nullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').nullable().defaultTo(knex.fn.now());
  });
};

export const down = function (knex) {
  knex.schema.alterTable('treatment_vets', (t) => {
    t.dropForeign('user_id');
  });
  return knex.schema.dropTable('treatment_vets');
};
