export function up(knex) {
  return knex.schema.alterTable('apiaries', (t) => {
    t.integer('elevation').nullable().comment('Elevation above sea level in meters');
  });
}

export function down(knex) {
  return knex.schema.alterTable('apiaries', (t) => {
    t.dropColumn('elevation');
  });
}
