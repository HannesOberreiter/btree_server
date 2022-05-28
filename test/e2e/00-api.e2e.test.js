// require('module-alias/register');
// const { knexConfig } = require(process.cwd() +
//   '/dist/config/environment.config');
// const knexInstance = require('knex')(knexConfig);

process.env.ENVIROMENT = process.env.ENVIRONMENT
  ? process.env.ENVIRONMENT
  : 'test';
process.env.NODE_ENV = process.env.ENVIRONMENT;
process.env.ORIGIN = 'http://localhost:8002'; // must be in accordance with .env AUTHORIZED=http://localhost:8001
process.env.CONTENT_TYPE = 'application/json';
const p = require('path');

require('dotenv').config({
  path: p.join(__dirname, `../env/${process.env.ENVIROMENT}.env`),
});

global.demoUser = {
  email: 'demo_en@btree.at',
  password: 'demo_en',
};

describe('E2E API tests', () => {
  before((done) => {
    //await knexInstance.seed.run();
    global.app = require(process.cwd() + '/dist/api/app.bootstrap');
    global.server = global.app.server;
    done();
  });
  //afterEach((done) => global.app.boot.stop(done));
  after(() => {
    global.app.boot.stop();
    global.app.dbServer.stop();
    global.app = undefined;
    global.server = undefined;
  });

  require('./01-api-routes.e2e.test');
  require('./02-auth-routes.e2e.test');
  require('./03-calendar-routes.e2e.test');
  require('./04-field_setting-routes.e2e.test');
  require('./05-company-routes.e2e.test');
  require('./06-company-user-routes.e2e.test');
  require('./07-apiary-routes.e2e.test');
  require('./08-hive-routes.e2e.test');
});
