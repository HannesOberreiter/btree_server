const { describe, before, after } = require('mocha');

process.env.ENVIROMENT = process.env.ENVIRONMENT
  ? process.env.ENVIRONMENT
  : 'test.cjs';
process.env.NODE_ENV = process.env.ENVIRONMENT;
process.env.ORIGIN = 'http://localhost:8002'; // must be in accordance with .env AUTHORIZED=http://localhost:8001
process.env.CONTENT_TYPE = 'application/json';

require('dotenv').config({
  path: `./env/${process.env.ENVIROMENT}.env`,
});

global.demoUser = {
  email: `test@btree.at`,
  password: 'test_btree',
  name: 'Test Beekeeper',
  lang: 'en',
  newsletter: false,
  source: '0',
};

describe('e2E API tests', () => {
  let knexInstance;

  before(async function () {
    this.timeout(10000);
    const { knexConfig } = await import(
      `${process.cwd()}/dist/config/environment.config.js`
    );
    knexInstance = require('knex')(knexConfig);

    console.log('  knex migrate latest ...');
    await knexInstance.migrate.latest();
    if (process.env.ENVIRONMENT !== 'ci') {
      console.log('  knex truncate tables ...');
      // knexInstance.migrate.rollback({ all: true })
      await knexInstance.raw('SET FOREIGN_KEY_CHECKS = 0;');
      const tables = await knexInstance
        .table('information_schema.tables')
        .select('table_name', 'table_schema', 'table_type')
        .where('table_type', 'BASE TABLE')
        .where('table_schema', knexConfig.connection.database);
      for (const t of tables) {
        if (
          !(
            ['KnexMigrations', 'KnexMigrations_lock'].includes(t.table_name)
            || t.table_name.includes('innodb')
          )
        ) {
          await knexInstance.raw(`TRUNCATE ${t.table_name};`);
        }
      }
      await knexInstance.raw('SET FOREIGN_KEY_CHECKS = 1;');
    }
    global.app = await import(`${process.cwd()}/dist/app.bootstrap.js`);
    global.server = global.app.server;
  });

  after(async () => {
    try {
      console.log('Shutting down server ...');
      await global.app.gracefulShutdown();
      knexInstance.destroy();
      console.log('Server shut down');
    }
    catch (e) {
      console.error(e);
    }
  });

  require('./01-api-routes.e2e.test.cjs');
  require('./02-auth-routes.e2e.test.cjs');
  require('./03-calendar-routes.e2e.test.cjs');
  require('./04-field_setting-routes.e2e.test.cjs');
  require('./05-company-routes.e2e.test.cjs');
  require('./06-company-user-routes.e2e.test.cjs');
  require('./07-apiary-routes.e2e.test.cjs');
  require('./08-hive-routes.e2e.test.cjs');
  require('./09-movedate-routes.e2e.test.cjs');
  require('./10-todo-routes.e2e.test.cjs');
  require('./11-option-routes.e2e.test.cjs');
  require('./12-charge-routes.e2e.test.cjs');
  require('./13-feed-routes.e2e.test.cjs');
  require('./14-treatment-routes.e2e.test.cjs');
  require('./15-checkup-routes.e2e.test.cjs');
  require('./16-harvest-routes.e2e.test.cjs');
  require('./17-scale-routes.e2e.test.cjs');
  require('./18-scale_data-routes.e2e.test.cjs');
  require('./19-queen-routes.e2e.test.cjs');
  require('./20-rearing-routes.e2e.test.cjs');
  require('./21-rearing_detail-routes.e2e.test.cjs');
  require('./22-rearing_type-routes.e2e.test.cjs');
  require('./23-rearing_step-routes.e2e.test.cjs');
});
