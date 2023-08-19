/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  const query = knex('rearing_steps').select('id', 'detail_id');
  return query.then(async (rows) => {
    await rows.forEach(async (row) => {
      const detail = await knex('rearing_details')
        .select('hour')
        .where('id', row.detail_id);
      await knex('rearing_steps')
        .update({
          sleep_before: detail[0].hour,
        })
        .where('id', row.id);
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {};
