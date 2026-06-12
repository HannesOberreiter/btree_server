/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const rows = await knex('rearing_steps').select('id', 'detail_id');

  await Promise.all(
    rows.map(async (row) => {
      const detail = await knex('rearing_details')
        .select('hour')
        .where('id', row.detail_id);
      await knex('rearing_steps')
        .update({
          sleep_before: detail[0].hour,
        })
        .where('id', row.id);
    }),
  );
}

export function down() {}
