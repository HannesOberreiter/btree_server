exports.up = function (knex) {
  return knex.schema.createTable('bees', (t) => {
    t.increments('id').primary().unsigned();
    t.string('firstname', 45);
    t.string('lastname', 45);
    t.string('email', 100).unique();
    t.string('password', 128);
    t.string('salt', 128);
    t.string('reset', 128).comment('Password reset key');
    t.timestamp('reset_timestamp')
      .nullable()
      .defaultTo(knex.fn.now())
      .comment('Timestamp for Reseting Password, only allow a certain time');
    t.boolean('state')
      .defaultTo(0)
      .comment(
        'Variable to close Accounts without deleting user for history (multiple user in one company)'
      );

    // user settings
    t.string('lang', 3);
    t.boolean('format').defaultTo(1).comment('User Time and Date Format');
    t.boolean('acdate')
      .defaultTo(1)
      .comment(
        'If VIS Date (AUSTRIA) is shown in calendar or not, also for newsletter reminder'
      );
    t.boolean('newsletter').defaultTo(1);
    t.boolean('todo')
      .defaultTo(1)
      .comment('1 shows done todos in calendar 0 not');
    t.boolean('sound')
      .defaultTo(1)
      .comment(
        'If user wants to sounds when action is saved succefully or on error etc'
      );
    t.boolean('tablexscroll')
      .defaultTo(1)
      .comment('If user want to allow horizontal scrolling in tables');

    t.string('source', 45).comment(
      'User Registration Source, 1=-; 2=Recommended by colleague; 3=Search Engine; 4=Social Media; 5=Ads; 6=Magazine; 7=App Store; Empty or other Text given'
    );

    t.timestamp('last_visit').nullable().defaultTo(knex.fn.now());
    t.timestamp('created_at').nullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').nullable().defaultTo(knex.fn.now());

    // Foreign Keys
    t.integer('saved_company').unsigned().nullable();
    t.foreign('saved_company')
      .references('companies.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });
};

exports.down = function (knex) {
  knex.schema.alterTable('bees', (t) => {
    t.dropForeign('saved_company');
  });
  return knex.schema.dropTable('bees');
};
