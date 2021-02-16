
exports.up = function(knex) {
    return knex.schema.createTable('charges', t => {
        t.increments('id').primary().unsigned();

        t.date('date');
        t.string('bez', 255);
        t.string('charge', 255);
        t.date('bestbefore');
        t.string('calibrate', 45);
        t.float('amount', 45);
        t.float('price', 45);
        t.string('unit', 45);
        t.string('note', 2000);
        t.string('url', 512);
        t.string('kind', 45).comment("out or in, for outgoing or incoming");

        t.integer('type_id').unsigned().nullable();
        t.foreign('type_id').
          references('charge_types.id').
          onDelete('SET NULL').onUpdate('CASCADE');
        
        t.boolean('deleted').defaultTo(0).comment('if element is deleted (soft delete)');
        t.timestamp('deleted_at').nullable().defaultTo(knex.fn.now());
        
        t.timestamp('created_at').nullable().defaultTo(knex.fn.now());
        t.timestamp('updated_at').nullable().defaultTo(knex.fn.now());

        t.integer('bee_id').unsigned().nullable().comment('Creator');
        t.integer('edit_id').unsigned().nullable().comment('Editor');
        t.integer('user_id').unsigned().nullable().comment('Company ID');

        t.foreign('bee_id').
                references('bees.id').
                onDelete('SET NULL').onUpdate('CASCADE');
        t.foreign('edit_id').
                references('bees.id').
                onDelete('SET NULL').onUpdate('CASCADE');
        t.foreign('user_id').
                references('companies.id').
                onDelete('SET NULL').onUpdate('CASCADE');

    });
};

exports.down = function(knex) {
    knex.schema.alterTable("charges", t => {
        t.dropForeign("bee_id");
        t.dropForeign("edit_id");
        t.dropForeign("user_id");
        t.dropForeign("type_id");    
    });
    return knex.schema.dropTable("charges");
};
