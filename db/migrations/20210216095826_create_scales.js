
exports.up = function(knex) {
    return knex.schema.createTable('scales', t => {
        t.increments('id').primary().unsigned();
        
        t.string('ident', 45);

        t.integer('hive_id').unsigned().nullable();
        t.foreign('hive_id').
          references('hives.id').
          onDelete('SET NULL').onUpdate('CASCADE');
        
        t.integer('user_id').unsigned().nullable();
        t.foreign('user_id').
          references('companies.id').
          onDelete('SET NULL').onUpdate('CASCADE');

    });
};

exports.down = function(knex) {
    knex.schema.alterTable("scales", t => {
        t.dropForeign("hive_id");
        t.dropForeign("user_id");   
    });
    return knex.schema.dropTable("scales");
    };
