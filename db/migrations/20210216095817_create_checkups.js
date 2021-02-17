
exports.up = function(knex) {
    return knex.schema.createTable('checkups', t => {
        t.increments('id').primary().unsigned();

        t.date('date');
        t.date('enddate');

        t.boolean('queen');
        t.boolean('queencells');
        t.boolean('eggs');
        t.boolean('capped_brood');

        t.float('brood');
        t.float('pollen');
        t.float('comb');
        t.float('temper');
        t.float('calm_comb');
        t.float('swarm');

        t.string('varroa', 12).comment('Varchar old system had strings in it needs to be cleaned out.');
        t.integer('strong', 12);

        t.float('temp');

        t.float('weight');
        t.time('time');

        t.integer('broodframes', 12);
        t.integer('honeyframes', 12);
        t.integer('foundation', 12);
        t.integer('emptyframes', 12);

        t.string('note', 2000);
        t.string('url', 512);
        t.boolean('done').defaultTo(1);

        t.integer('hive_id').unsigned().nullable();
        t.foreign('hive_id').
          references('hives.id').
          onDelete('SET NULL').onUpdate('CASCADE');

        t.integer('type_id').unsigned().nullable();
        t.foreign('type_id').
          references('checkup_types.id').
          onDelete('SET NULL').onUpdate('CASCADE');
        
        t.boolean('deleted').defaultTo(0).comment('if element is deleted (soft delete)');
        t.timestamp('deleted_at').nullable().defaultTo(knex.fn.now());
        
        t.timestamp('created_at').nullable().defaultTo(knex.fn.now());
        t.timestamp('updated_at').nullable().defaultTo(knex.fn.now());

        t.integer('bee_id').unsigned().nullable().comment('Creator');
        t.integer('edit_id').unsigned().nullable().comment('Editor');

        t.foreign('bee_id').
                references('bees.id').
                onDelete('SET NULL').onUpdate('CASCADE');
        t.foreign('edit_id').
                references('bees.id').
                onDelete('SET NULL').onUpdate('CASCADE');

    });
};

exports.down = function(knex) {
    knex.schema.alterTable("checkups", t => {
        t.dropForeign("bee_id");
        t.dropForeign("edit_id");
        t.dropForeign("hive_id");
        t.dropForeign("type_id");    
    });
    return knex.schema.dropTable("checkups");
};
