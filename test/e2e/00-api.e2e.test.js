process.env.NODE_ENV = 'test';
process.env.ENVIRONMENT = 'test';
process.env.ORIGIN = 'http://localhost:8001'; // must be in accordance with .env AUTHORIZED=http://localhost:8001
process.env.CONTENT_TYPE = 'application/json';
const p = require('path');
var assert = require('assert');
require('dotenv').config({
  path: p.join(__dirname, `../env/test.env`),
});

// --- API server

describe('E2E API tests', () => {
  var app;

  before(() => {
    app = require(process.cwd() + '/dist/api/app.bootstrap');
  });
  after(() => {
    app.boot.stop();
    app.dbServer.stop();
  });

  require('./01-api-routes.e2e.test');
  //require('./02-auth-routes.e2e.test');
  //require('./03-user-routes.e2e.test');
  //require('./04-media-routes.e2e.test');
});
