export async function up(knex) {
  await knex.schema.alterTable('wax_lots', (table) => {
    table.integer('created_by_operation_id').unsigned().nullable().index();
    table
      .foreign('created_by_operation_id')
      .references('wax_operations.id')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
  });

  await knex.raw(`
    UPDATE wax_lots
    SET created_by_operation_id = (
      SELECT wax_operation_lines.operation_id
      FROM wax_operation_lines
      INNER JOIN wax_operations
        ON wax_operations.id = wax_operation_lines.operation_id
      WHERE wax_operation_lines.lot_id = wax_lots.id
        AND wax_operation_lines.direction = 'output'
      ORDER BY wax_operations.date, wax_operations.id, wax_operation_lines.id
      LIMIT 1
    )
  `);
}

export async function down(knex) {
  await knex.schema.alterTable('wax_lots', (table) => {
    table.dropForeign(['created_by_operation_id']);
    table.dropColumn('created_by_operation_id');
  });
}
