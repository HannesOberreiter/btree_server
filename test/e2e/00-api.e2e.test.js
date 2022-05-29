require('module-alias/register');
const { knexConfig } = require(process.cwd() +
  '/dist/config/environment.config.js');
const knexInstance = require('knex')(knexConfig);

process.env.ENVIROMENT = process.env.ENVIRONMENT
  ? process.env.ENVIRONMENT
  : 'test';
process.env.NODE_ENV = process.env.ENVIRONMENT;
process.env.ORIGIN = 'http://localhost:8002'; // must be in accordance with .env AUTHORIZED=http://localhost:8001
process.env.CONTENT_TYPE = 'application/json';
const { table } = require('console');
const p = require('path');

require('dotenv').config({
  path: p.join(__dirname, `../env/${process.env.ENVIROMENT}.env`),
});

global.demoUser = {
  email: `test@btree.at`,
  password: 'test_btree',
  name: 'Test Beekeeper',
  lang: 'en',
  newsletter: false,
  source: '0',
};

describe('E2E API tests', () => {
  before(async function () {
    this.timeout(10000);
    console.log('  knex migrate latest ...');
    await knexInstance.migrate.latest();
    console.log('  knex truncate tables ...');
    //knexInstance.migrate.rollback({ all: true })
    await knexInstance.raw('SET FOREIGN_KEY_CHECKS = 0;');
    const tables = await knexInstance
      .table('information_schema.tables')
      .select('table_name', 'table_schema', 'table_type')
      .where('table_type', 'BASE TABLE')
      .where('table_schema', knexConfig.connection.database);
    for (t of tables) {
      if (
        !(
          ['KnexMigrations', 'KnexMigrations_lock'].includes(t.TABLE_NAME) ||
          t.TABLE_NAME.includes('innodb')
        )
      )
        await knexInstance.raw(`TRUNCATE ${t.TABLE_NAME};`);
    }
    await knexInstance.raw('SET FOREIGN_KEY_CHECKS = 1;');
    global.app = require(process.cwd() + '/dist/api/app.bootstrap');
    global.server = global.app.server;
  });

  after(() => {
    global.app.boot.stop();
    global.app.dbServer.stop();
    global.app = undefined;
    global.server = undefined;
    knexInstance.destroy();
  });

  require('./01-api-routes.e2e.test');
  require('./02-auth-routes.e2e.test');
  require('./03-calendar-routes.e2e.test');
  require('./04-field_setting-routes.e2e.test');
  require('./05-company-routes.e2e.test');
  require('./06-company-user-routes.e2e.test');
  require('./07-apiary-routes.e2e.test');
  require('./08-hive-routes.e2e.test');
  require('./09-movedate-routes.e2e.test');
  require('./10-todo-routes.e2e.test');
  require('./11-option-routes.e2e.test');
  require('./12-charge-routes.e2e.test');
  require('./13-feed-routes.e2e.test');
  require('./14-treatment-routes.e2e.test');
  require('./15-checkup-routes.e2e.test');
  require('./16-harvest-routes.e2e.test');
  require('./17-scale-routes.e2e.test');
  require('./18-scale_data-routes.e2e.test');
  require('./19-queen-routes.e2e.test');
  require('./20-rearing-routes.e2e.test');
  require('./21-rearing_detail-routes.e2e.test');
  require('./22-rearing_type-routes.e2e.test');
  require('./23-rearing_step-routes.e2e.test');
});
