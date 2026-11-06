const defaults = {
  de: {
    products: ['Wachsblock', 'Mittelwände', 'Verkaufsprodukte', 'Restwachs'],
    origins: ['Deckelwachs', 'Altwaben', 'Brutwaben', 'Mischung'],
  },
  en: {
    products: ['Wax block', 'Foundation', 'Products for sale', 'Residual wax'],
    origins: ['Cappings wax', 'Old combs', 'Brood combs', 'Mixture'],
  },
};

async function insertChunks(knex, table, rows) {
  for (let offset = 0; offset < rows.length; offset += 500) {
    await knex(table).insert(rows.slice(offset, offset + 500));
  }
}

export async function up(knex) {
  const [companies, members, products, origins] = await Promise.all([
    knex('companies').select('id'),
    knex('company_bee')
      .innerJoin('bees', 'bees.id', 'company_bee.bee_id')
      .select('company_bee.user_id', 'company_bee.rank', 'bees.lang')
      .orderBy('company_bee.user_id')
      .orderBy('company_bee.rank'),
    knex('wax_products').select('user_id', 'name'),
    knex('wax_origin_types').select('user_id', 'name'),
  ]);

  const languages = new Map();
  for (const member of members) {
    if (!languages.has(member.user_id)) {
      languages.set(member.user_id, member.lang);
    }
  }
  const existingProducts = new Set(
    products.map((row) => `${row.user_id}:${row.name}`),
  );
  const existingOrigins = new Set(
    origins.map((row) => `${row.user_id}:${row.name}`),
  );
  const productRows = [];
  const originRows = [];

  for (const company of companies) {
    const language = languages.get(company.id) === 'de' ? 'de' : 'en';
    for (const name of defaults[language].products) {
      if (!existingProducts.has(`${company.id}:${name}`)) {
        productRows.push({ name, user_id: company.id });
      }
    }
    for (const name of defaults[language].origins) {
      if (!existingOrigins.has(`${company.id}:${name}`)) {
        originRows.push({ name, user_id: company.id });
      }
    }
  }

  await insertChunks(knex, 'wax_products', productRows);
  await insertChunks(knex, 'wax_origin_types', originRows);
}

export function down() {
  // No rollback: defaults may have been edited or used by live wax records.
}
