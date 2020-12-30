
exports.up = function(knex) {
    return knex.schema.createTable('checkup_types', t => {
        t.increments('id').primary().unsigned();

        t.string('name', 45);
        t.boolean('modus').defaultTo(1);
        t.boolean('favorite').defaultTo(0);

        t.integer('user_id').unsigned().nullable();
        t.foreign('user_id').
          references('companies.id').
          onDelete('SET NULL').onUpdate('CASCADE');

        t.timestamp('created_at').nullable().defaultTo(knex.fn.now());
        t.timestamp('updated_at').nullable().defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
    knex.schema.alterTable("checkup_types", t => {
      t.dropForeign("user_id");
    });
    return knex.schema.dropTable("checkup_types");
};
