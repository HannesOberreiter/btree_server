export const up = function (knex) {
  return knex.schema.alterTable('queens', (t) => {
    t.integer('mother_id').unsigned().nullable();
    t.foreign('mother_id')
      .references('queens.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });
};

export const down = function (knex) {
  return knex.schema.alterTable('queens', (t) => {
    t.dropForeign('mother_id');
  });
};
